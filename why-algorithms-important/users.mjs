// Input
const messages = [{id: 1, text: 'hello', userId: 1}];
const users = [{id: 1, userName: 'viktor'}];

// Output
const messagesWithUsername = [{id: 1, text: 'hello', userId: 1, userName: 'Viktor'}];


export function mergeMessagesNaive(messages, users)  {
    for (const message of messages) {
        message['userName'] = users.find(user => user.id === message.userId)?.userName
    }

    return messages;
}


export function mergeMessagesOptimized(messages, users)  {
    const usersByIds = Object.fromEntries(users.map(user => [user.id, user]));

    for (const message of messages) {
        message['userName'] = usersByIds[message.userId]?.userName
    }

    return messages;
}