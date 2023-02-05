import { mergeMessagesNaive, mergeMessagesOptimized } from "./users.mjs";

function generateUsers(count) {
    const users = [];

    for (let i = 0; i < count; i++) {
        users.push({
            id: i,
            userName: `User ${i}`
        });
    }

    return users;
}

function generateMessages(count, users) {
    const messages = [];

    for (let i = 0; i < count; i++) {
        messages.push({
            id: i,
            text: `Some text ${i}`,
            userId: users[users.length - 1].id
        });
    }

    return messages;
}


function benchmarkMergeNaive(usersCount, messagesCount, noLogs) {
    const users = generateUsers(usersCount);
    const messages = generateMessages(messagesCount, users);

    if (!noLogs) console.time('mergeMessagesNaive');
    const start = new Date();
    const mergedMessages = mergeMessagesNaive(messages, users);
    if (!noLogs) console.timeEnd('mergeMessagesNaive');
}


function benchmarkMergeOptimized(usersCount, messagesCount, noLogs) {
    const users = generateUsers(usersCount);
    const messages = generateMessages(messagesCount, users);

    if (!noLogs) console.time('mergeMessagesOptimized');
    const mergedMessages = mergeMessagesOptimized(messages, users);
    if (!noLogs) console.timeEnd('mergeMessagesOptimized');
}


const usersCount = 10000;
const messagesCount = 10000;
benchmarkMergeNaive(usersCount, messagesCount, true);
benchmarkMergeOptimized(usersCount, messagesCount, true);

benchmarkMergeNaive(usersCount, messagesCount);
benchmarkMergeOptimized(usersCount, messagesCount);
