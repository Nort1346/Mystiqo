import React, { useEffect, useState, useRef, RefObject } from 'react';
import { Button, Form, Container, InputGroup } from 'react-bootstrap';
import { socket } from './socket';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import Message from './components/Message';
import Footer from './components/Footer';
import NavBar from './components/Navbar';
import Queue from './components/Queue';

export interface MessageData {
  content: string,
  authorId: string
}

enum Status {
  'home',
  'queue',
  'chat'
}

enum ChatStatus {
  'active',
  'inactive'
}

function App() {
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [status, setStatus] = useState<Status>(Status.home);
  const [chatStatus, setChatStatus] = useState<ChatStatus>(ChatStatus.inactive);
  const [inputValue, setInputValue] = useState('');
  const [userId, setUserId] = useState<string>('');
  const messageContainerRef: RefObject<HTMLDivElement> = useRef(null);
  const ContainerRef: RefObject<HTMLDivElement> = useRef(null);
  const TypingContainerRef: RefObject<HTMLDivElement> = useRef(null);

  useEffect(() => {
    function onUserId(userId: string) {
      setUserId(userId);
    }

    socket.emit('getUserId');
    socket.on('userId', onUserId);
    return () => {
      socket.off('userId', onUserId);
    };
  }, []);

  useEffect(() => {
    let timeout: NodeJS.Timeout | null = null;
    function onMessage(authorId: string, content: string) {
      if (authorId != userId) {
        if (timeout) {
          clearTimeout(timeout);
        }
        resetTyping();
      }
      setMessages((mess: any) => [...mess, { content: content, authorId: authorId }]);
    }

    function onJoinedRoom() {
      setMessages([{ content: 'You joined to the room', authorId: 'SYSTEM' }]);
      setStatus(Status.chat);
      setChatStatus(ChatStatus.active);
    }

    function onStrangerLeftRoom() {
      setMessages((mess: any) => [...mess, { content: 'Stranger left the room', authorId: 'SYSTEM' }]);
      setChatStatus(ChatStatus.inactive);
    }

    function onTyping(userid: string) {
      if (userid === userId) return;
      if (TypingContainerRef.current) {
        TypingContainerRef.current.innerHTML = `Stranger is typing...`;
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

    socket.on('strangerLeftRoom', onStrangerLeftRoom);
    socket.on('message', onMessage);
    socket.on('joinedRoom', onJoinedRoom);
    socket.on('typing', onTyping);
    return () => {
      socket.off('message', onMessage);
      socket.off('joinedRoom', onJoinedRoom);
      socket.off('typing', onTyping);
    };
  }, []);

  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const joinQueue = () => {
    socket.emit('joinQueue');
    setStatus(Status.queue);
  }

  const cancelQueue = () => {
    socket.emit('cancelQueue');
    setStatus(Status.home);
  }

  const nextTalk = () => {
    setMessages([]);
    joinQueue();
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.value.length > inputValue.length) {
      socket.emit('typing');
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
      socket.emit('sendMessage', inputValue);
      setInputValue('');
    }
  }

  return (
    <>
      <NavBar />
      <Container ref={ContainerRef}>
        {status === Status.home && (
          <div className='h-75vh d-flex align-items-center justify-content-center flex-column text-center'>
            <h1>Mystiqo</h1>
            <p className='text-primary-emphasis'>Talk with strangers</p>
            <Button variant='light rounded-pill' onClick={joinQueue} size="lg">Start Chatting</Button>
          </div>
        )}
        {status === Status.queue && (
          <Queue cancelQueue={cancelQueue} />
        )}
        {status === Status.chat && (
          <>
            <div className='position-relative h-70vh mb-3 overflow-auto' style={{ height: `calc(100vh - 64px - 50px - 3em)`, width: '100%' }} ref={messageContainerRef}>
              <div className='p-3 d-flex flex-column'>
                {messages.map((ele, index) => (
                  <Message key={index} message={ele} userId={userId} />
                ))}
              </div>
            </div>
            <div className="position-fixed start-50 translate-middle-x mb-3 px-2" style={{ bottom: '1em', maxWidth: ContainerRef.current?.offsetWidth, width: ContainerRef.current?.offsetWidth, height: '50px' }}>
              <InputGroup>
                <Button variant='info' onClick={nextTalk}>
                  Next
                </Button>
                <Form.Control
                  placeholder="Message to stranger..."
                  aria-label="message"
                  onKeyDown={handleKeyDown}
                  type="text"
                  value={inputValue}
                  onChange={handleChange}
                  as="textarea"
                  size='lg'
                  rows={1}
                  disabled={chatStatus === ChatStatus.inactive}
                />
                <Button onClick={sendMessage} disabled={chatStatus === ChatStatus.inactive}>
                  Send
                </Button>
              </InputGroup>
              <div ref={TypingContainerRef}></div>
            </div>
          </>


        )}
        {status === Status.home && (
          <Footer />
        )}
      </Container>
    </>
  );
}

export default App;
