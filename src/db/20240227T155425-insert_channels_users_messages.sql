-- sqlite3 belay.sqlite3 < 20240227T155425-insert_channels_users_messages.sql 

insert into users (id, username, password) values (
    0,
    "pan",
    "kub"
);

insert into users (id, username, password) values (
    1,
    "eed",
    "olive"
);

insert into channels (id, channel_name) values (
    0,
    "Pan's return waiting room"
);

insert into channels (id, channel_name) values (
    1,
    "Olive's petting corner"
);

insert into channels (id, channel_name) values (
    2,
    "Chess tournament"
);

insert into messages (id, user_id, channel_id, reply_counter, body) values (
    0,
    0,
    0,
    0,
    "That olive dog is so fluffy!!! I love her"
);

insert into messages (id, user_id, channel_id, reply_counter, body) values (
    1,
    1,
    0,
    0,
    "Right? Olive is the best dog to ever exist in the history of all dogs"
);

insert into messages (id, user_id, channel_id, reply_counter, body) values (
    2,
    0,
    0,
    0,
    "Well, the best dog would be baobao, but Olive is up there for sure!
    https://www.purina.co.uk/sites/default/files/styles/square_medium_440x440/public/2023-05/BREED%20Hero%20Desktop%20Japanese%20Akita_0.jpg?h=cf89a47e&itok=BjubDY4h"
);

insert into messages (id, user_id, channel_id, reply_counter, body) values (
    3,
    1,
    1,
    1,
    "Hello? Anyone here?"
);

insert into messages (id, user_id, channel_id, reply_to_id, body) values (
    4,
    1,
    1,
    3,
    "Yes me! Haha! ... I'm so lonely"
);
