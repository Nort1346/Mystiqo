import React, { useEffect, useState, useRef, RefObject } from 'react';
import { Button, Form, Container, InputGroup, Modal, ToggleButtonGroup, ToggleButton } from 'react-bootstrap';
import { socket } from './socket';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import Message from './components/Message';
import Footer from './components/Footer';
import NavBar from './components/Navbar';
import Queue from './components/Queue';
import i18n from './i18n';
import { useTranslation } from 'react-i18next';
import { MessageData } from './components/types/interfaces';
import { ChatStatus, Events, Gender, Language, Status } from './components/types/enums';
import { inputDefault, inputSelected } from './components/styles/input';
import { isMobileDevice } from './components/functions/functions';

function App() {
  const { t } = useTranslation()
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [status, setStatus] = useState<Status>(Status.Home);
  const [chatStatus, setChatStatus] = useState<ChatStatus>(ChatStatus.Inactive);
  const [inputValue, setInputValue] = useState('');
  const [userId, setUserId] = useState<string>(localStorage.getItem('userId') ?? '');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const handleCloseConfigModal = () => setShowConfigModal(false);
  const handleShowConfigModal = () => setShowConfigModal(true);
  const [gender, setGender] = useState<Gender>(() => {
    const storedGender = localStorage.getItem('gender');
    if (storedGender && Object.values(Gender).includes(storedGender as Gender)) {
      return storedGender as Gender;
    } else {
      return Gender.PreferNotSay;
    }
  });
  const [language, setLanguage] = useState<Language>(() => {
    const storedLanguage = localStorage.getItem('i18nextLng');
    if (storedLanguage && Object.values(Language).includes(storedLanguage as Language)) {
      return storedLanguage as Language;
    } else {
      return Language.English;
    }
  });
  const [preferGender, setPreferGender] = useState<Gender>(() => {
    const storedGender = localStorage.getItem('preferGender');
    if (storedGender && Object.values(Gender).includes(storedGender as Gender)) {
      return storedGender as Gender;
    } else {
      return Gender.PreferNotSay;
    }
  });
  const [screenHeight, setScreenHeight] = useState<number>(window.innerHeight);
  const messageContainerRef: RefObject<HTMLDivElement> = useRef(null);
  const typingContainerRef: RefObject<HTMLDivElement> = useRef(null);

  useEffect(() => {
    function onUserId(userId: string) {
      setUserId(userId);
      localStorage.setItem(Events.UserId, userId);
    }

    function onConnect() {
      socket.emit(Events.GetUserId);
    }

    socket.on(Events.Connect, onConnect);
    socket.on(Events.UserId, onUserId);
    return () => {
      socket.off(Events.UserId, onUserId);
      socket.off(Events.Connect, onConnect);
    };
  }, [userId]);

  useEffect(() => {
    let timeout: NodeJS.Timeout | null = null;
    function onMessage(authorId: string, content: string) {
      if (authorId !== userId) {
        if (timeout) {
          clearTimeout(timeout);
        }
        resetTyping();
      }
      setMessages((mess: any) => [...mess, { content: content, authorId: authorId }]);
    }

    function onJoinedRoom() {
      setMessages([{ content: t('Room.System.youJoinedToTheRoom'), authorId: 'SYSTEM' }]);
      setInputValue("");
      setStatus(Status.Chat);
      setChatStatus(ChatStatus.Active);
    }

    function onStrangerLeftRoom() {
      if (chatStatus === ChatStatus.Inactive) return;
      setMessages((mess: any) => [...mess, { content: t('Room.System.strangerLeftTheRoom'), authorId: 'SYSTEM' }]);
      setChatStatus(ChatStatus.Inactive);
    }

    function onTyping(userid: string) {
      if (userid === userId) return;
      if (typingContainerRef.current) {
        typingContainerRef.current.innerHTML = t('Room.strangerIsTyping');
        if (timeout) {
          clearTimeout(timeout);
        }

        timeout = setTimeout(() => {
          resetTyping();
        }, 5000);
      }
    }

    function resetTyping() {
      if (typingContainerRef.current) {
        typingContainerRef.current.innerHTML = '';
      }
    }

    socket.on(Events.StrangerLeftRoom, onStrangerLeftRoom);
    socket.on(Events.Message, onMessage);
    socket.on(Events.JoinedRoom, onJoinedRoom);
    socket.on(Events.Typing, onTyping);
    return () => {
      socket.off(Events.Message, onMessage);
      socket.off(Events.JoinedRoom, onJoinedRoom);
      socket.off(Events.Typing, onTyping);
      socket.off(Events.StrangerLeftRoom, onStrangerLeftRoom);
    };
  }, [userId, chatStatus, t]);

  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    switch (status) {
      case Status.Home: {
        document.title = `Mystiqo | ${t('Title.talkWithStrangers')}`;
        break;
      }
      case Status.Queue: {
        document.title = `Mystiqo | ${t('Title.waitingForStranger')}`;
        break;
      }
      case Status.Chat: {
        document.title = `Mystiqo | ${t('Title.chattingWithStranger')}`;
        break;
      }
    }
  }, [status, t]);

  useEffect(() => {
    const handleResize = () => {
      setScreenHeight(window.innerHeight);
    };

    const onEscNextStranger = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        nextTalk();
      }
    }

    window.addEventListener('resize', handleResize);
    window.addEventListener("keydown", onEscNextStranger);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener("keydown", onEscNextStranger);
    };
  });

  const handleGenderChange = (value: Gender) => {
    setGender(value);
    localStorage.setItem('gender', value);
  };

  const handlePreferGenderChange = (value: Gender) => {
    setPreferGender(value);
    localStorage.setItem('preferGender', value);
  };

  const handleLanguageChange = (language: Language) => {
    i18n.changeLanguage(language, (err, t) => {
      if (err) return console.error('Something went wrong loading language', err);
      setLanguage(language);
    });
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.value.length > inputValue.length) {
      socket.emit(Events.Typing);
    }
    setInputValue(event.target.value);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isMobileDevice() && event.key === 'Enter' && !event.shiftKey) {
      sendMessage();
      event.preventDefault();
    }
  };

  const joinQueue = () => {
    socket.emit(Events.JoinQueue,
      {
        gender: gender,
        language: language ?? Language.English,
        preferGender: preferGender
      });
    setStatus(Status.Queue);
  }

  const cancelQueue = () => {
    socket.emit(Events.CancelQueue);
    setStatus(Status.Home);
  }

  const gotoHome = () => {
    if (status === Status.Chat) {
      if (chatStatus === ChatStatus.Active)
        socket.emit(Events.LeaveRoom);
      setMessages([]);
    } else if (status === Status.Queue) {
      socket.emit(Events.CancelQueue);
    }
    setStatus(Status.Home);
  }

  const nextTalk = () => {
    setMessages([]);
    joinQueue();
  }

  const sendMessage = () => {
    if (inputValue.trim() !== '') {
      socket.emit(Events.SendMessage, inputValue);
      setInputValue('');
    }
  }

  return (
    <div style={{ height: '-webkit-fill-available' }}>
      <NavBar goToHome={gotoHome} />
      <Container fluid={true} className='m-0 p-0'>
        {status === Status.Home && (
          <Container>
            <div className='h-75vh d-flex align-items-center justify-content-center flex-column text-center'>
              <h1>Mystiqo</h1>
              <p className='text-primary-emphasis'>{t('Home.mystiqoDescription')}</p>
              <Button variant='light rounded-pill' className='mb-2' onClick={joinQueue} size="lg">{t('Home.startChatting')}</Button>
              <Button variant='dark rounded-pill' onClick={handleShowConfigModal}>{t('Home.personalize')}</Button>
            </div>
            <Modal show={showConfigModal} onHide={handleCloseConfigModal} size='xl' fullscreen={'md-down'}>
              <Modal.Header closeButton>
                <Modal.Title>{t('PersonalizeModal.title')}</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <h5>{t('PersonalizeModal.whatIsYourGender')}</h5>
                <div className='d-flex justify-content-center mb-3'>
                  <ToggleButtonGroup type="radio" name="gender-options" value={gender} onChange={handleGenderChange} className='d-flex flex-row flex-wrap justify-content-center'>
                    <ToggleButton variant="secondary rounded-pill" className='m-1 p-1 px-2' style={gender === Gender.PreferNotSay ? inputSelected : inputDefault} value={Gender.PreferNotSay} id={'tbg-notsay-gender'}>{t('Gender.preferNotSay')}</ToggleButton>
                    <ToggleButton variant="primary rounded-pill" className='m-1 p-1 px-2' style={gender === Gender.Male ? inputSelected : inputDefault} value={Gender.Male} id={'tbg-male-gender'}>{t('Gender.male')}</ToggleButton>
                    <ToggleButton variant="success rounded-pill" className='m-1 p-1 px-2' style={gender === Gender.Female ? inputSelected : inputDefault} value={Gender.Female} id={'tbg-female-gender'}>{t('Gender.female')}</ToggleButton>
                    <ToggleButton variant="warning rounded-pill" className='m-1 p-1 px-2' style={gender === Gender.Croissant ? inputSelected : inputDefault} value={Gender.Croissant} id={'tbg-croissant-gender'}>{t('Gender.croissant')}</ToggleButton>
                  </ToggleButtonGroup>
                </div>
                <hr />
                <h5>{t('PersonalizeModal.inWhichLanguageDoYouPreferToChat')}</h5>
                <div className='d-flex justify-content-center mb-3'>
                  <ToggleButtonGroup type="radio" name="language-options" value={language} onChange={handleLanguageChange} className='d-flex flex-row flex-wrap justify-content-center'>
                    <ToggleButton variant="primary rounded-pill" className='m-1 p-1 px-2' style={language === Language.English ? inputSelected : inputDefault} value={Language.English} id={'tbg-english-language'}>🇺🇸 English</ToggleButton>
                    <ToggleButton variant="danger rounded-pill" className='m-1 p-1 px-2' style={language === Language.Polish ? inputSelected : inputDefault} value={Language.Polish} id={'tbg-polish-language'}>🇵🇱 Polski</ToggleButton>
                    <ToggleButton variant="danger rounded-pill" className='m-1 p-1 px-2' style={language === Language.German ? inputSelected : inputDefault} value={Language.German} id={'tbg-german-language'}>🇩🇪 Deutsch</ToggleButton>
                  </ToggleButtonGroup>
                </div>
                <hr />
                <h5>{t('PersonalizeModal.whichGenderWouldYouLikeToChatWith')}</h5>
                <div className='d-flex justify-content-center mb-3'>
                  <ToggleButtonGroup type="radio" name="prefer-gender-options" value={preferGender} onChange={handlePreferGenderChange} className='d-flex flex-row flex-wrap justify-content-center'>
                    <ToggleButton variant="secondary rounded-pill" className='m-1 p-1 px-2' style={preferGender === Gender.PreferNotSay ? inputSelected : inputDefault} value={Gender.PreferNotSay} id={'tbg-notsay-prefer-gender'}>{t('Gender.any')}</ToggleButton>
                    <ToggleButton variant="primary rounded-pill" className='m-1 p-1 px-2' style={preferGender === Gender.Male ? inputSelected : inputDefault} value={Gender.Male} id={'tbg-male-prefer-gender'}>{t('Gender.male')}</ToggleButton>
                    <ToggleButton variant="success rounded-pill" className='m-1 p-1 px-2' style={preferGender === Gender.Female ? inputSelected : inputDefault} value={Gender.Female} id={'tbg-female-prefer-gender'}>{t('Gender.female')}</ToggleButton>
                    <ToggleButton variant="warning rounded-pill" className='m-1 p-1 px-2' style={preferGender === Gender.Croissant ? inputSelected : inputDefault} value={Gender.Croissant} id={'tbg-croissant-prefer-gender'}>{t('Gender.croissant')}</ToggleButton>
                  </ToggleButtonGroup>
                </div>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={handleCloseConfigModal}>
                  {t('Button.close')}
                </Button>
              </Modal.Footer>
            </Modal>
            <Footer />
          </Container>
        )}
        {status === Status.Queue && (
          <Queue cancelQueue={cancelQueue} />
        )}
        {status === Status.Chat && (
          <>
            <div className='mb-3 overflow-auto' style={{ height: `calc(${screenHeight}px - 160px)` }} ref={messageContainerRef}>
              <Container>
                <div className='p-3 d-flex flex-column'>
                  {messages.map((ele, index) => (
                    <Message key={index} message={ele} userId={userId} />
                  ))}
                </div>
              </Container>
            </div>

            <Container>
              <div>
                <InputGroup className='pb-1'>
                  <Button variant='warning' onClick={nextTalk}>
                    {t('Room.Input.next')}
                  </Button>
                  <Form.Control
                    placeholder={t('Room.Input.placeholder')}
                    aria-label="message"
                    onKeyDown={handleKeyDown}
                    type="text"
                    value={inputValue}
                    onChange={handleChange}
                    as="textarea"
                    size='lg'
                    rows={1}
                    disabled={chatStatus === ChatStatus.Inactive}
                    autoFocus
                    style={{ resize: 'none' }}
                    className='py-2'
                  />
                  <Button onClick={sendMessage} disabled={chatStatus === ChatStatus.Inactive}>
                    {t('Room.Input.send')}
                  </Button>
                </InputGroup>
                <div ref={typingContainerRef}></div>
              </div>
            </Container>
          </>
        )}
      </Container>
    </div>
  );
}

export default App;
