from flask import *
import sqlite3

app = Flask(__name__)

def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect('./db/belay.sqlite3')
        db.row_factory = sqlite3.Row
        setattr(g, '_database', db)
    return db

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

def query_db(query, args=(), one=False, insert=False):
    db = get_db()
    cursor = db.execute(query, args)
    rows = cursor.fetchall()
    db.commit()
    cursor.close()

    if insert:
        last_id = cursor.lastrowid
        return last_id

    if rows:
        if one: 
            return rows[0]
        return rows
    return None

@app.route('/')
@app.route('/profile')
@app.route('/login')
@app.route('/signup')
@app.route('/channel')
@app.route('/home')
@app.route('/channel/<int:channel_id>')
@app.route('/channel/<int:channel_id>/<int:thread_id>')
def http_request(channel_id=None, thread_id=None):
    return app.send_static_file('index.html')

@app.route('/api/login', methods=['POST'])
def login():
    username = request.headers.get('username')
    password = request.headers.get('password')

    # Check database for if theres a match
    user = query_db('SELECT * FROM users WHERE username = ?', [username])

    if not user:
        return jsonify({
            'success': False,
            'error': "User does not exist"
        })
    
    user_dict = dict(user[0])

    if user_dict['password'] == password:
        return jsonify({
            'success': True,
            'user-id': user_dict['id']
            })
    else:
        return jsonify({
            'success': False,
            'error': "Incorrect password"
        })

@app.route('/api/create/account', methods=['POST'])
def create_account():
    username = request.headers.get('username')
    password = request.headers.get('password')

    # Check database for if theres a match
    user = query_db('SELECT * FROM users WHERE username = ?', [username])
    if user:
        return jsonify({
            'success': False,
            'error': 'Username already exists'
        })
    
    # Update database with new user
    user_id = query_db('INSERT INTO users (username, password) VALUES (?, ?)', [username, password], insert=True)
    # Set all messages to already read
    channels = query_db('SELECT * FROM channels')
    for channel in channels:
        channel_dict = dict(channel)
        channel_id = channel_dict['id']
        messages = query_db('SELECT * FROM messages WHERE channel_id = ? AND reply_to_id IS NULL', [channel_id])
        message_id = dict(messages[-1])['id']
        query_db('INSERT INTO recent_comment (user_id, channel_id, message_id) values (?, ?, ?)', [user_id, channel_id, message_id])

    return jsonify({
        'success': True,
        'user-id': user_id
    })

@app.route('/api/update/username', methods=['POST'])
def change_username():
    new_username = request.headers.get('new-username')
    user_id = int(request.headers.get('user-id'))

    query_db('UPDATE users SET username = ? WHERE id = ?', [new_username, user_id])

    return jsonify({
        'success': True,
    }), 200

@app.route('/api/update/password', methods=['POST'])
def change_password():
    new_password = request.headers.get('new-password')
    user_id = int(request.headers.get('user-id'))

    query_db('UPDATE users SET password = ? WHERE id = ?', [new_password, user_id])
    
    return jsonify({
        'success': True,
    }), 200
    
@app.route('/api/get/messages')  # Returns messages based on channel id
def get_messages():
    channel_id = request.headers.get('channel-id')

    messages = query_db('SELECT * FROM messages WHERE channel_id = ?', [channel_id])

    message_dicts = []
    if messages:
        for message in messages:
            message_dicts.append(dict(message))

    return jsonify({
        'success': True,
        'message-dicts': message_dicts
    })

@app.route('/api/set/last_read', methods=['POST'])
def set_read():
    channel_id = request.headers.get('channel-id')
    user_id = request.headers.get('user-id')

    messages = query_db('SELECT * FROM messages WHERE channel_id = ? AND reply_to_id IS NULL', [channel_id])
    if messages:
        last_message_id = dict(messages[-1])['id']
        query_db('INSERT OR REPLACE INTO recent_comment (message_id, channel_id, user_id) VALUES (?, ?, ?)', [last_message_id, channel_id, user_id])

    return jsonify({
        'success': True,
    })

@app.route('/api/get/unread')
def get_read():    
    user_id = request.headers.get('user-id')
    channels = query_db('SELECT * FROM channels')
    print(user_id)

    latest_messages = []
    for channel in channels:
        channel_id = dict(channel)['id']
        messages = query_db('SELECT * FROM messages WHERE reply_to_id IS NULL AND channel_id = ?', [channel_id])
        if not messages:
            continue

        # Find id of last message seen by user in current channel, if row doesn't exist set everything to unread
        last_seen_message = query_db('SELECT * FROM recent_comment WHERE user_id = ? AND channel_id = ?', [user_id, channel_id])
        if last_seen_message:
            last_seen_message_id = dict(last_seen_message[0])['message_id']
        else:
            last_seen_message_id = -1

        unread_messages = 0
        for message in reversed(messages):
            if dict(message)['id'] == last_seen_message_id:
                break
            else:
                unread_messages += 1
        latest_messages.append({
            'channel_id': channel_id,
            'unread': unread_messages
        })
        
    return jsonify({
        'success': True,
        'unread-dict': latest_messages
    })
    
@app.route('/api/get/users')
def send_usernames():
    users = query_db('SELECT * FROM users')
    user_dicts = []
    for user in users:
        user_dicts.append(dict(user))

    return jsonify({
        'success': True,
        'user-dicts': user_dicts
    })

@app.route('/api/get/channels')
def send_channels():
    channels = query_db('SELECT * FROM channels')
    channel_dicts = []
    for channel in channels:
        channel_dicts.append(dict(channel))

    return jsonify({
        'success': True,
        'channel-dicts': channel_dicts
    })

@app.route('/api/get/replies')
def get_replies():
    channel_id = int(request.headers.get('channel-id'))
    message_id = int(request.headers.get('message-id'))

    replies = query_db('SELECT * FROM messages WHERE channel_id = ? AND reply_to_id = ?', [channel_id, message_id])
    if replies:
        reply_dicts = []
        for reply in replies:
            reply_dicts.append(dict(reply))

        return jsonify({
            'success': True,
            'reply-dicts': reply_dicts
        })
    return jsonify({
        'success': False,
        'error': "No replies found"
    })

@app.route('/api/send/message', methods=['POST'])
def send_message():
    user_id = int(request.headers.get('user-id'))
    channel_id = int(request.headers.get('channel-id'))
    message = request.headers.get('message')

    query_db('INSERT INTO messages (user_id, channel_id, body) VALUES (?, ?, ?)', [user_id, channel_id, message])

    return jsonify({
        'success': True,
    }), 200

@app.route('/api/send/reply', methods=['POST'])
def send_reply():
    user_id = int(request.headers.get('user-id'))
    channel_id = int(request.headers.get('channel-id'))
    reply_to_id = int(request.headers.get('reply-to-id'))
    message = request.headers.get('message')

    query_db('INSERT INTO messages (user_id, channel_id, reply_to_id, body) VALUES (?, ?, ?, ?)', [user_id, channel_id, reply_to_id, message])
    query_db('UPDATE messages SET reply_counter = reply_counter + 1 WHERE id = ?', [reply_to_id])

    return jsonify({
        'success': True,
    }), 200