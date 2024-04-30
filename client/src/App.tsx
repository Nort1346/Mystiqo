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

export interface MessageData {
  content: string,
  authorId: string
}

enum Status {
  home,
  queue,
  chat
}

enum ChatStatus {
  active,
  inactive
}

enum Language {
  English = 'en',
  Polish = 'pl'
};

enum Gender {
  Male = 'male',
  Female = 'female',
  Croissant = 'croissant',
  PreferNotSay = 'preferNotSay'
};

enum Events {
  Message = 'message',
  JoinedRoom = 'joinedRoom',
  Typing = 'typing',
  StrangerLeftRoom = 'strangerLeftRoom',
  JoinQueue = 'joinQueue',
  CancelQueue = 'cancelQueue',
  LeaveRoom = 'leaveRoom',
  SendMessage = 'sendMessage'
}

function App() {
  const { t } = useTranslation()
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [status, setStatus] = useState<Status>(Status.home);
  const [chatStatus, setChatStatus] = useState<ChatStatus>(ChatStatus.inactive);
  const [inputValue, setInputValue] = useState('');
  const [userId, setUserId] = useState<string>('');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const handleCloseConfigModal = () => setShowConfigModal(false);
  const handleShowConfigModal = () => setShowConfigModal(true);
  const [gender, setGender] = useState<Gender | string>(localStorage.getItem('gender') ?? Gender.PreferNotSay);
  const [language, setLanguage] = useState<Language | string>(localStorage.getItem('i18nextLng') ?? Language.English);
  const [preferGender, setPreferGender] = useState<Gender | string>(localStorage.getItem('preferGender') ?? Gender.PreferNotSay);
  const messageContainerRef: RefObject<HTMLDivElement> = useRef(null);
  const TypingContainerRef: RefObject<HTMLDivElement> = useRef(null);
  const [screenHeight, setScreenHeight] = useState<number>(window.innerHeight);

  useEffect(() => {
    function onUserId(userId: string) {
      setUserId(userId);
    }

    socket.emit('getUserId');
    socket.on('userId', onUserId);
    return () => {
      socket.off('userId', onUserId);
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
      setStatus(Status.chat);
      setChatStatus(ChatStatus.active);
    }

    function onStrangerLeftRoom() {
      if (chatStatus === ChatStatus.inactive) return;
      setMessages((mess: any) => [...mess, { content: t('Room.System.strangerLeftTheRoom'), authorId: 'SYSTEM' }]);
      setChatStatus(ChatStatus.inactive);
    }

    function onTyping(userid: string) {
      if (userid === userId) return;
      if (TypingContainerRef.current) {
        TypingContainerRef.current.innerHTML = t('Room.strangerIsTyping');
        if (timeout) {
          clearTimeout(timeout);
        }

        timeout = setTimeout(() => {
          resetTyping();
        }, 5000);
      }
    }

    function resetTyping() {
      if (TypingContainerRef.current) {
        TypingContainerRef.current.innerHTML = '';
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
      case Status.home: {
        document.title = `Mystiqo | ${t('Title.talkWithStrangers')}`;
        break;
      }
      case Status.queue: {
        document.title = `Mystiqo | ${t('Title.waitingForStranger')}`;
        break;
      }
      case Status.chat: {
        document.title = `Mystiqo | ${t('Title.chattingWithStranger')}`;
        break;
      }
    }
  }, [status, t]);

  useEffect(() => {
    const handleResize = () => {
      setScreenHeight(window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleGenderChange = (value: Gender) => {
    setGender(value);
    localStorage.setItem('gender', value);
  };

  const handlePreferGenderChange = (value: Gender) => {
    setPreferGender(value);
    localStorage.setItem('preferGender', value);
  };

  const handleLanguageChange = (language: string) => {
    i18n.changeLanguage(language, (err, t) => {
      if (err) return console.error('Something went wrong loading language', err);
      setLanguage(language);
    });
  };

  const joinQueue = () => {
    socket.emit(Events.JoinQueue,
      {
        gender: gender,
        language: language ?? Language.English,
        preferGender: preferGender
      });
    setStatus(Status.queue);
  }

  const cancelQueue = () => {
    socket.emit(Events.CancelQueue);
    setStatus(Status.home);
  }

  const gotoHome = () => {
    if (status === Status.chat) {
      if (chatStatus === ChatStatus.active)
        socket.emit(Events.LeaveRoom);
      setMessages([]);
    } else if (status === Status.queue) {
      socket.emit(Events.CancelQueue);
    }
    setStatus(Status.home);
  }

  const nextTalk = () => {
    setMessages([]);
    joinQueue();
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.value.length > inputValue.length) {
      socket.emit(Events.Typing);
    }
    setInputValue(event.target.value);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      sendMessage();
      event.preventDefault();
    }
  };

  const sendMessage = () => {
    if (inputValue.trim() !== '') {
      socket.emit(Events.SendMessage, inputValue);
      setInputValue('');
    }
  }

  const selectInput = {
    border: '0.3em solid #FFF',
  }

  const inputDefault = {
    border: '0.3em solid rgba(0,0,0,0)'
  }

  return (
    <div style={{ height: '-webkit-fill-available' }}>
      <NavBar goToHome={gotoHome} />
      <Container fluid={true} className='m-0 p-0'>
        {status === Status.home && (
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
                  <ToggleButtonGroup type="radio" name="gender-options" value={gender} onChange={handleGenderChange}>
                    <ToggleButton variant="secondary rounded-pill" className='mx-1 p-1' style={gender === Gender.PreferNotSay ? selectInput : inputDefault} value={Gender.PreferNotSay} id={'tbg-notsay-gender'}>{t('Gender.preferNotSay')}</ToggleButton>
                    <ToggleButton variant="primary rounded-pill" className='mx-1 p-1' style={gender === Gender.Male ? selectInput : inputDefault} value={Gender.Male} id={'tbg-male-gender'}>{t('Gender.male')}</ToggleButton>
                    <ToggleButton variant="success rounded-pill" className='mx-1 p-1' style={gender === Gender.Female ? selectInput : inputDefault} value={Gender.Female} id={'tbg-female-gender'}>{t('Gender.female')}</ToggleButton>
                    <ToggleButton variant="warning rounded-pill" className='mx-1 p-1' style={gender === Gender.Croissant ? selectInput : inputDefault} value={Gender.Croissant} id={'tbg-croissant-gender'}>{t('Gender.croissant')}</ToggleButton>
                  </ToggleButtonGroup>
                </div>
                <hr />
                <h5>{t('PersonalizeModal.inWhichLanguageDoYouPreferToChat')}</h5>
                <div className='d-flex justify-content-center mb-3'>
                  <ToggleButtonGroup type="radio" name="language-options" value={language} onChange={handleLanguageChange}>
                    <ToggleButton variant="primary rounded-pill" className='mx-1 p-1' style={language === Language.English ? selectInput : inputDefault} value={Language.English} id={'tbg-english-language'}>🇺🇸 English</ToggleButton>
                    <ToggleButton variant="danger rounded-pill" className='mx-1 p-1' style={language === Language.Polish ? selectInput : inputDefault} value={Language.Polish} id={'tbg-polish-language'}>🇵🇱 Polski</ToggleButton>
                  </ToggleButtonGroup>
                </div>
                <hr />
                <h5>{t('PersonalizeModal.whichGenderWouldYouLikeToChatWith')}</h5>
                <div className='d-flex justify-content-center mb-3'>
                  <ToggleButtonGroup type="radio" name="prefer-gender-options" value={preferGender} onChange={handlePreferGenderChange}>
                    <ToggleButton variant="secondary rounded-pill" className='mx-1 p-1' style={preferGender === Gender.PreferNotSay ? selectInput : inputDefault} value={Gender.PreferNotSay} id={'tbg-notsay-prefer-gender'}>{t('Gender.any')}</ToggleButton>
                    <ToggleButton variant="primary rounded-pill" className='mx-1 p-1' style={preferGender === Gender.Male ? selectInput : inputDefault} value={Gender.Male} id={'tbg-male-prefer-gender'}>{t('Gender.male')}</ToggleButton>
                    <ToggleButton variant="success rounded-pill" className='mx-1 p-1' style={preferGender === Gender.Female ? selectInput : inputDefault} value={Gender.Female} id={'tbg-female-prefer-gender'}>{t('Gender.female')}</ToggleButton>
                    <ToggleButton variant="warning rounded-pill" className='mx-1 p-1' style={preferGender === Gender.Croissant ? selectInput : inputDefault} value={Gender.Croissant} id={'tbg-croissant-prefer-gender'}>{t('Gender.croissant')}</ToggleButton>
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
        {status === Status.queue && (
          <Queue cancelQueue={cancelQueue} />
        )}
        {status === Status.chat && (
          <>
            <div className='mb-3 overflow-auto' style={{ height: `calc(${screenHeight}px - 60px - 105px)` }} ref={messageContainerRef}>
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
                    disabled={chatStatus === ChatStatus.inactive} />
                  <Button onClick={sendMessage} disabled={chatStatus === ChatStatus.inactive}>
                    {t('Room.Input.send')}
                  </Button>
                </InputGroup>
                <div ref={TypingContainerRef}></div>
              </div>
            </Container>
          </>
        )}
      </Container>
    </div>
  );
}

export default App;
