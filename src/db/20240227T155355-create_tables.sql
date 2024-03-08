-- sqlite3 belay.sqlite3 < 20240227T155355-create_tables.sql

create table users (
    id INTEGER PRIMARY KEY,
    username VARCHAR(30) NOT NULL,
    password VARCHAR(30) NOT NULL
);

create table channels (
    id INTEGER PRIMARY KEY,
    channel_name VARCHAR(255) NOT NULL
);

create table messages (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    channel_id INTEGER,
    reply_to_id INTEGER,
    reply_counter INTEGER,
    body TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (channel_id) REFERENCES channel(id)
);

create table reactions (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    message_id INTEGER,
    emoji INTEGER
);

create table recent_comment (
    user_id INTEGER,
    channel_id INTEGER,
    message_id INTEGER,
    PRIMARY KEY (user_id, channel_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (channel_id) REFERENCES channels(id),
    FOREIGN KEY (message_id) REFERENCES messages(id)
);

