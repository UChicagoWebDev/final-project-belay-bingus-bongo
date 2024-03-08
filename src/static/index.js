function App() {
    const [currentPath, setCurrentPath] = React.useState(window.location.pathname)  // States as "single source of truth"
    const [channels, setChannels] = React.useState([])
    const [messages, setMessages] = React.useState([])
    const [replies, setReplies] = React.useState([])
    const [users, setUsers] = React.useState([])
    const [currentChannel, setCurrentChannel] = React.useState(null)
    const [activeThread, setActiveThread] = React.useState(null)
    const [unreadMessageCounts, setUnreadMessageCounts] = React.useState([])
    const [userId, setUserId] = React.useState(undefined)

    React.useEffect(() => {     // On a new load, check localStorage to see if we are logged in
        const storedLogin = localStorage.getItem('eddiez-auth-key');
        setUserId(storedLogin || null);
    }, [])
    React.useEffect(() => {     // Handles redirection when we are not logged in and try to access another page
        console.log('User_id set to:', userId);
        if (userId == null || userId == undefined) {
            if (currentPath != '/' && currentPath != '/login' && currentPath != '/signup') {
                localStorage.setItem('prevPath', currentPath);
                updatePath('/');
            }
        } else {
            const prevPath = localStorage.getItem('prevPath') || '/home';
            updatePath(prevPath);
            localStorage.removeItem('prevPath');
        }
    }, [userId]);

    React.useEffect(() => {     // Handles history navigation
        function changePath() {     // Need to create a function for setCurrentPath so we can remove the same function when going to a new page
            setCurrentPath(window.location.pathname);
        }
        window.addEventListener('popstate', changePath);
        return () => {
            window.removeEventListener('popstate', changePath);
        }
    }, [])

    React.useEffect(() => {     // Gets channels in server and store as state
        async function getChannels() {
            try {
                const channel_url = `/api/get/channels`;
                let channel_response = await fetch(channel_url, {
                  method: 'GET',
                })
                const data = await channel_response.json();
                setChannels(data['channel-dicts']);
            } catch (error) {
                console.error('Error fetching channels from api, line 34', error);
            }
        }
        getChannels();
    }, [])
    React.useEffect(() => {     // Logs the channels when it gets retrieved
        console.log('Channels set to:', channels);
      }, [channels]);

    React.useEffect(() => {     // Get users in server
        // Finish this next and update channelpage accordingly
        async function getUsers() {
            try {
                const user_url = `/api/get/users`;
                let user_response = await fetch(user_url, {
                  method: 'GET',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                })
                const data = await user_response.json();
                setUsers(data['user-dicts']);
            } catch (error) {
                console.error('Error fetching users from API', error);
            }
        }

        getUsers();
    }, [])
    React.useEffect(() => {     // Logs users when they get retrieved
        console.log('Users set to:', users);
      }, [users]);

    React.useEffect(() => {     // Creates 1 second interval that constantly gets number of unread messages
        let interval
        async function getUnreadMessages() {
            try {
                const unread_message_url = `/api/get/unread`;
                let message_response = await fetch(unread_message_url, {
                  method: 'GET',
                  headers: {
                    'Content-Type': 'application/json',
                    'user-id': userId
                  },
                })
                const data = await message_response.json();
                setUnreadMessageCounts(data['unread-dict']);
            } catch (error) {
                console.error('Error getting unread messages from api', error);
            }
        }

        if (userId != null && userId != undefined) {
            interval = setInterval(() => {
                getUnreadMessages(userId);
            }, 1000);
        }

        return () => {
            if (interval) {
                console.log(`Removing interval that checks for number of unread messages`);
                clearInterval(interval);
            }
        };
    }, [userId])
    React.useEffect(() => {     // Logs the unread message counts when it gets retrieved
        // console.log('unreadMessageCounts set to:', unreadMessageCounts);
    }, [unreadMessageCounts])

    React.useEffect(() => {     // Listens to currentChannel to query the correct messages
        async function getMessage() {
            try {
                const message_url = `/api/get/messages`;
                let message_response = await fetch(message_url, {
                  method: 'GET',
                  headers: {
                    'Content-Type': 'application/json',
                    'channel-id': currentChannel
                  },
                })
                const data = await message_response.json();
                setMessages(data['message-dicts']);
                // if (data['success'] == true) {
                //     console.log("Successfully updated channel messages")
                // }
            } catch (error) {
                console.error('Error fetching messages from api', error);
            }
        }

        async function setLatestRead() {
            try {
                const latest_read_url = `/api/set/last_read`;
                let latest_read_response = await fetch(latest_read_url, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'user-id': userId,
                    'channel-id': currentChannel
                  },
                })
                const data = await latest_read_response.json();
                // if (data['success'] == true) {
                //     console.log("Successfully updated read message")
                // }
            } catch (error) {
                console.error('Error setting latest read message', error);
            }
        }
        if (currentChannel != null){    
            const interval = setInterval(() => {
                getMessage();
                setLatestRead();
            }, 500);
        
              return () => {
                console.log(`Removing interval that checks for new messages`);
                clearInterval(interval);
              };
        }
        console.log('current channel set to:', currentChannel);
    }, [currentChannel]);

    React.useEffect(() => {     // Listens to the currentPath state for setting the current channel, messages, current thread, and replies
            const split_url = currentPath.split('/');
            if (split_url[1] == 'channel' && split_url.length >= 3) {
                setCurrentChannel(parseInt(split_url[2]));
                if (split_url.length > 3) {
                    setActiveThread(parseInt(split_url[3]));
                } else {
                    setActiveThread(null);
                }
            } else {
                setCurrentChannel(null);
                setActiveThread(null);
            }
    }, [currentPath]);

    React.useEffect(() => {     // Listens to activeThread to query the correct replies
        async function getReplies() {
            try {
                const replies_url = `/api/get/replies`;
                let replies_response = await fetch(replies_url, {
                  method: 'GET',
                  headers: {
                    'Content-Type': 'application/json',
                    'channel-id': currentChannel,
                    'message-id': activeThread
                  },
                })
                const data = await replies_response.json();
                setReplies(data['reply-dicts']);
            } catch (error) {
                console.error('Error fetching messages from api', error);
            }
        }

        if (activeThread != null && currentChannel != null) {
            getReplies();
        }
        console.log('current thread set to:', activeThread);
    }, [activeThread, currentChannel]);
    React.useEffect(() => {     // Logs the replies when it gets retrieved
        console.log('Replies set to', replies)
    }, [replies])

    function updatePath(path) {     // Ties history and the react current path state together
      window.history.pushState({}, '', path);
      setCurrentPath(path);
      if (path == '/profile') {
        document.title = 'Profile';
      }
      if (path == '/home') {
        document.title = 'Home';
      }
      if (path == '/login') {
        document.title = 'Login';
      }
      if (path == '/signup') {
        document.title = 'Signup';
      }
      if (path.startsWith('/channel')) {
        if (channels.length == 0) {
            document.title = `Channel load`
        } else {
            if (activeThread != null) {
                document.title = `Reply ${activeThread}`
            } else {
                const link_array = path.split('/')
                const curr = link_array.pop()                
                document.title = channels[curr].channel_name;
            }
        }
      }
    };

    function handleLogin(userId) {  // Ties logging in to localstorage
        localStorage.setItem('eddiez-auth-key', userId)
        setUserId(userId)
    }

    function handleLogout() {       // Ties logging out to localstorage
        localStorage.removeItem('eddiez-auth-key')
        setUserId(null)
    }

    function renderFromPath() {     // Returns page of the url
        if (currentPath.startsWith('/channel')) {
            return activeThread != null ? (
                <>
                <div className="channelPageThread">                   
                    <ChannelList channels={channels} updatePath={updatePath} unreadMessageCounts={unreadMessageCounts} currentChannel={currentChannel} />
                    <div className="channelPageRight narrowHide" >
                        <ChannelPage messages={messages} users={users} setActiveThread={setActiveThread} currentChannel={currentChannel} updatePath={updatePath} />
                        <ChatInput userId={userId} currentChannel={currentChannel} />
                    </div>
                    <div className="threadPageRight">
                        <OpenThread replies={replies} users={users} setActiveThread={setActiveThread}/>
                        <ReplyInput userId={userId} currentChannel={currentChannel} activeThread={activeThread} />
                    </div>
                </div>
                <profileButton updatePath={updatePath} />
                </>
            ) : (
                <>
                <div className="channelPage">
                    <ChannelList channels={channels} updatePath={updatePath} unreadMessageCounts={unreadMessageCounts} currentChannel={currentChannel} />
                    <div className="channelPageRight">
                        <ChannelPage messages={messages} users={users} setActiveThread={setActiveThread} currentChannel={currentChannel} updatePath={updatePath} />
                        <ChatInput userId={userId} currentChannel={currentChannel} />
                    </div>
                </div>
                <ProfileButton updatePath={updatePath} />
                </>
            );
        }

        switch (currentPath) {
            case '/signup':
                return <SignupPage handleLogin={handleLogin} />;
            case '/login':
                return <LoginPage handleLogin={handleLogin} />;
            case '/':
                return <LoginOrSignup updatePath={updatePath} />;
            case '/profile':
                return (
                    <div className="profilePage">
                        <ChannelList channels={channels} updatePath={updatePath} unreadMessageCounts={unreadMessageCounts} currentChannel={currentChannel} />
                        <ProfilePage updatePath={updatePath} channels={channels} userId={userId} handleLogout={handleLogout} />
                    </div>
                )
            case '/home':
                return (
                    <div className="homePage">
                        <ChannelList channels={channels} updatePath={updatePath} unreadMessageCounts={unreadMessageCounts} currentChannel={currentChannel} />
                        <HomePage updatePath={updatePath} />
                    </div>
                )
            default:
                return <div>404 Not Found</div>;
        }
    }

    return(
        <>
            {renderFromPath()}
        </>
    )
}

function HomePage({ updatePath }) {     // Homepage
    function clickProfile(e) {
        e.preventDefault();
        updatePath('/profile')
    }
    return (
        <div className="homePageRight">
            <h2>Welcome back!</h2>
            <div className="profileLink">
                <a href="/profile" onClick={clickProfile}>Profile</a>
            </div>
        </div>
    )
}

function SignupPage({ handleLogin }) {   // Signup page
    const [username, setUsername] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [error, setError] = React.useState('');

    // Called when create account button is clicked
    async function handleSubmit(event) {
        event.preventDefault(); // Prevent default form submission behavior

        if (!password || !username) {
            setError('Must enter a password/username');
            return;
        }

        async function create_account(username, password) {
            try {
                const create_account_url = `/api/create/account`;
                let create_account_response = await fetch(create_account_url, {     // Returns whether user creation succeeded and the 
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'username': username,
                    'password': password,
                  },
                })
                const data = await create_account_response.json();
                if (data['success']) {
                    console.log('Account created for:', username, password);
                    handleLogin(data['user-id']);
                } else {
                    console.log('Existing username');
                    setError('That username already exists');
                }
            } catch (error) {
                console.error('Error creating account', error);
            }
        }

        setError('');
        create_account(username, password);
    };

    return (
        <div className="createAccountContainer">
          <h2>Create your Babel account</h2>
          <form onSubmit={handleSubmit}>
            <div className="signupForm">
                <label htmlFor="username">Username</label>
                <input name="username" value={username} onChange={(e) => setUsername(e.target.value)}></input>
                <label htmlFor="password">Password</label>
                <input name="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}></input>
                {error && <p className="errorMessage">{error}</p>}
            </div>
            <div className="signupButtonContainer">
                <button type="submit">Create Account</button>
            </div>
          </form>
        </div>
      )
}

function LoginPage({ handleLogin }) {    // Login page
    const [username, setUsername] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [error, setError] = React.useState('');

    // Called when login button is clicked
    const handleSubmit = (event) => {
        event.preventDefault(); // Prevent default form submission behavior

        if (!username) {
            setError("Cannot leave username blank")
            return
        }
        if (!password) {
            setError("Cannot leave password blank")
            return
        }

        async function login(username, password) {
            try {
                const login_url = `/api/login`;
                let login_response = await fetch(login_url, {     // Returns whether login succeeded and if so user-id, otherwise error message
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'username': username,
                    'password': password,
                  },
                })
                const data = await login_response.json();
                if (data['success']) {
                    console.log('Logged into:', username, password);
                    handleLogin(data['user-id']);
                } else {
                    setError(data['error']);
                }
            } catch (error) {
                console.error('Error logging in', error);
            }
        }

        login(username, password);
    };

    return (
        <div className="login_container">
          <h2>Login</h2>
          <form onSubmit={handleSubmit}>
            <div className="login_form">
                <label htmlFor="username">Username</label>
                <input name="username" value={username} onChange={(e) => setUsername(e.target.value)}></input>
                <label htmlFor="password">Password</label>
                <input name="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}></input>
            </div>
            <div className="loginButtonContainer">
                <button type="submit">Login</button>
            </div>
            {error && <p className="errorMessage">{error}</p>}
          </form>
        </div>
      );
}

function LoginOrSignup({ updatePath }) {   // Serves as splash page when not logged in
    function clickLogin(e) {
        e.preventDefault();
        updatePath('/login');
    }

    function clickSignup(e) {
        e.preventDefault();
        updatePath('/signup');
    }

    return (
        <>
        <div className="create_or_login">
        <h1>Welcome to Belay!</h1>
          <h2>You are not logged in</h2>
            <div className="inlinecontainer">
                <a href="/login" onClick={clickLogin}>Login</a>
                <a href="/signup" onClick={clickSignup}>Sign Up</a>
            </div>
        </div>
        </>
      );
}

function ProfilePage({ updatePath, userId, handleLogout }) {    // Profile page where users can signout, change username or password
    const [newUsername, setNewUsername] = React.useState('');
    const [newPassword, setNewPassword] = React.useState('');
    const [error, setError] = React.useState('');

    // Called when change username button clicked
    async function clickChangeUsername(e) {
        e.preventDefault();

        if (!newUsername) {
            setError('Cannot leave blank');
            return
        }

        async function update_username(userId, newUsername) {
            try {
                const update_username_url = `/api/update/username`;
                let update_username_response = await fetch(update_username_url, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'new-username': newUsername,
                    'user-id': userId,
                  },
                })
                const data = await update_username_response.json();
                if (data['success']) {
                    console.log('Username changed to', newUsername);
                }
            } catch (error) {
                console.error('Error changing username', error);
            }
        }

        setError('');
        update_username(userId, newUsername);
    };

    // Called when change password button clicked
    async function clickChangePassword(e) {
        e.preventDefault();

        if (!newPassword) {
            setError('Cannot leave blank');
            return
        }

        async function update_password(userId, newPassword) {
            try {
                const update_password_url = `/api/update/password`;
                let update_password_response = await fetch(update_password_url, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'new-password': newPassword,
                    'user-id': userId,
                  },
                })
                const data = await update_password_response.json();
                if (data['success']) {
                    console.log('Password changed to', newPassword);
                } else {
                    setError(data['error']);
                }
            } catch (error) {
                console.error('Error changing password', error);
            }
        }

        setError('');
        update_password(userId, newPassword);
    };

    function clickSignout(e) {
        e.preventDefault();
        handleLogout();
        console.log('signed out');
        updatePath('/');
    }

    return (
        <>
        <div className="profilePageRight">
            <div className="profileForm">
                <h2>Update Your Profile</h2>
                <div className="usernameGroup">
                    <label htmlFor="username">Username</label>
                    <input name="username" value={newUsername} onChange={(e) => setNewUsername(e.target.value)}></input>
                    <button onClick={clickChangeUsername}>Change username</button>
                </div>
                <div className="passwordGroup">
                    <label htmlFor="password">Password</label>
                    <input name="password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}></input>
                    <button onClick={clickChangePassword}>Change password</button>
                </div>
                <button onClick={clickSignout}>Sign out</button>
                {error && <p className="errorMessage">{error}</p>}
            </div>
        </div>
        </>    
    )
}

const ChannelList = React.memo(function ChannelList({ updatePath, channels, unreadMessageCounts, currentChannel }) {    // Page that lists all the channels
    function clickChannel(e, channel_id) {
        e.preventDefault();
        const channel_link = `/channel/${channel_id}`
        updatePath(channel_link);
    }

    return(
        <div className="channelListContainer">
            <div className="channelList">
            <h3>Channel list</h3>
            {channels.map(channel => (
                <div className="channelName" key={channel.id} >
                    <a className={currentChannel == channel.id ? 'current-channel' : 'other'} onClick={(e) => clickChannel(e, channel.id)}>
                    {channel.channel_name + ' ' + (
                        (() => {
                        const unread = unreadMessageCounts.find(unreadMessageCount => unreadMessageCount.channel_id == channel.id)?.unread;
                        if (unread > 0) { // If there are unread messages
                            return `(${unread})`;
                        }
                        return '';
                        })()
                    )}
                    </a>
                </div>
              
            ))}
            </div>
        </div>
    )
})

function ChannelPage({ messages, users, setActiveThread, currentChannel, updatePath }) {
    if (!messages) {
        return null;
    }
    // Click function to allow replying to messages/going into threads
    function clickThread(message_id) {
        setActiveThread(message_id);
        const channel_thread_link = `/channel/${currentChannel}/${message_id}`;
        updatePath(channel_thread_link);
    }

    return (
        <>
        <div className="chatBoxContainer">
            {messages.map((message) => {
                const images = parseImage(message.body);
                if (message.reply_to_id == null) {
                    return (
                        <div className="messageContainer" key={message.id}>
                            <p className="username">{users[message.user_id].username}</p>
                            <p className="message">{message.body}</p>
                            {images.map((url, index) => (
                                <img key={index} src={url} alt={`Attached image ${index + 1}`} style={{maxWidth: '100px', maxHeight: '100px'}} />
                            ))}
                            <p className="replyCount" onClick={() => clickThread(message.id)}>
                                {message.reply_counter ? `${message.reply_counter} replies` : 'No replies'}
                            </p>
                        </div>
                    );
                } else {
                    return null;
                }
            })}
        </div>
        </>
    )
}

function OpenThread({ replies, users, setActiveThread }) {
    if (!replies) {
        return null;
    }

    function closeThread(e) {
        e.preventDefault();
        setActiveThread(null);
    }

    return (
        <div className="threadContainer">
            <button onClick={closeThread}>Close Thread</button>
            {replies.map((reply) => {
                return (
                    <div className="replyContainer" key={reply.id}>
                        <p className="username">{users[reply.user_id].username}</p>
                        <p className="reply">{reply.body}</p>
                    </div>
                );
            })}
        </div>
    )
}

function parseImage(message_text) {
    const urlRegex = /(https?:\/\/\S+\.(?:jpg|jpeg|png|gif))/g;
    const urls = message_text.match(urlRegex);
    return urls || [];
}

function ChatInput({ userId, currentChannel }) {
    const [message, setMessage] = React.useState('');

    async function send_message(userId, currentChannel, message) {
        try {
            const send_message_url = `/api/send/message`;
            let send_message_response = await fetch(send_message_url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'message': message,
                'user-id': userId,
                'channel-id': currentChannel,
              }
            })
            const data = await send_message_response.json();
        } catch (error) {
            console.error('Error changing username', error);
        }
    }
  
    const sendChat = (e) => {
        e.preventDefault();
        send_message(userId, currentChannel, message);
        setMessage('');
    };
  
    return (
      <form onSubmit={sendChat}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button type="submit">Send</button>
      </form>
    );
}

function ReplyInput({ userId, currentChannel, activeThread }) {
    const [message, setMessage] = React.useState('');

    async function send_reply(userId, currentChannel, activeThread, message) {
        try {
            const send_reply_url = `/api/send/reply`;
            let send_reply_response = await fetch(send_reply_url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'message': message,
                'user-id': userId,
                'channel-id': currentChannel,
                'reply-to-id': activeThread
              }
            })
            const data = await send_reply_response.json();
        } catch (error) {
            console.error('Error changing username', error);
        }
    }
  
    const sendReply = (e) => {
        e.preventDefault();
        send_reply(userId, currentChannel, activeThread, message);
        setMessage('');
    };
  
    return (
      <form onSubmit={sendReply}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button type="submit">Send</button>
      </form>
    );
}

function ProfileButton({ updatePath }) {
    function clickProfile(e) {
        e.preventDefault();
        updatePath('/profile')
    }

    return(
        <div className="profileLink">
            <a href="/profile" onClick={clickProfile}>Profile</a>
        </div>
    )
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />)
