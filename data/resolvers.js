const models = require('../models');
const {
    Client,
    PrivateKey
} =
require('dsteem');
const {
    UserInputError,
    AuthenticationError
} = require('apollo-server');

const itb64 = require('../helpers/itb64');



const ProxyAgent = require('proxy-agent');
var proxyUri = process.env.socks_proxy || 'http://127.0.0.1:9080';
let option = {
    agent: new ProxyAgent(proxyUri),
    addressPrefix: 'STM',
    chainId: '0000000000000000000000000000000000000000000000000000000000000000',
}
const client = new Client('https://api.steemit.com', option);

let expireTime = 60 * 1000; //1 min
let head_block_number = 0;
let head_block_id = '';

const resolvers = {
    Query: {
        getParentsPost: async (parent, args) => {

            let parents = await getParents(args.username);
            let name = turn();
            if (parents.indexOf(name) === -1) parents.push(name);
            let posts = await getUserPosts(parents);

            return posts;
        },
        getFeeds: async (parent, args) => {

            let posts = await getFeedByUsername(args.username);

            return posts;
        },
        getCommentsFeed: async (parent, args) => {

            let comments = await getCommentsByFeed(args.author, args.permlink);

            return comments;
        },
        getUserAvatar: async (parent, args) => {

            let avatar = await getAvatar(args.username);

            return avatar;
        },
        loginUser: async (parent, args) => {

            if (!args.username || !args.activeKey) {
                throw new UserInputError('ورودی نا معتبر')
            }
            await main();
            let result = await verifyTx(args.username, args.activeKey)
            return result
        },

    },

    Mutation: {

        voteUser: async (parent, args) => {
            const {
                username,
                activeKey,
                permlink,
                author
            } = args
            await main();
            let result = await vote(username, activeKey, author, permlink)

            return result

        }
    }

}

const getParents = async (user) => {
    let child = await models.User.findOne({
        where: {
            username: user
        }
    });


    let users = [];
    while (await child.getParent()) {
        child = await child.getParent();
        users.push(child.username.toLowerCase())
    }
    return users
}


async function getPost(username) {
    const query = {
        tag: username,
        limit: 1,
    };
    let result = await client.database
        .getDiscussions('blog', query);

    if (!result[0]) return;


    let url = `https://steemitimages.com/u/${username}/avatar/small`;

    let avatar = await itb64(url, {
        agent: new ProxyAgent(proxyUri)
    })

    return {
        ...result[0],
        avatar
    }
}

async function appendAvatar(feed) {

    let avatar = await getAvatar(feed.avatar)

    return {
        ...feed,
        avatar
    }
}

async function getAvatar(username) {
    let url = `https://steemitimages.com/u/${username}/avatar/small`;

    let avatar = await itb64(url, {
        agent: new ProxyAgent(process.env.test_proxy)
    })
    return avatar;
}
async function getFeedByUsername(username) {
    const query = {
        tag: username,
        limit: 10,
    };
    let posts = await client.database
        .getDiscussions('feed', query);
    const promises = posts.map(appendAvatar);

    let postsWithAvatar = await Promise.all(promises);

    return postsWithAvatar
}
async function getUserPosts(users) {

    const promises = users.map(getPost);

    let posts = await Promise.all(promises);
    posts = posts.filter(x => x != null);
    return posts;

}

async function getCommentsByFeed(author, permlink) {
    let comments = await client.database
        .call('get_content_replies', [author, permlink]);

    const promises = comments.map(appendAvatar);

    let commentsWithAvatar = await Promise.all(promises);

    return commentsWithAvatar;
}

function turn() {
    let date = new Date();
    let m = date.getMonth();
    let d = date.getDay();
    let name;
    if (m % 2 == 0) {
        if (d % 2 == 0) {
            name = 'navidgoalpure'
        } else {
            name = 'davood-ed'
        }
    } else {
        if (d % 2 == 0) {
            name = 'davood-ed'
        } else {
            name = 'navidgoalpure'
        }
    }

    return name;

}


async function main() {

    const props = await client.database.getDynamicGlobalProperties();

    head_block_number = props.head_block_number;

    head_block_id = props.head_block_id;

}

async function verifyTx(username, key) {
    let op = {
        ref_block_num: head_block_number, //reference head block number required by tapos (transaction as proof of stake)
        ref_block_prefix: Buffer.from(head_block_id, 'hex').readUInt32LE(4), //reference buffer of block id as prefix
        expiration: new Date(Date.now() + expireTime)
            .toISOString()
            .slice(0, -5), //set expiration time for transaction (+1 min)
        operations: [
            [
                'vote',
                {
                    voter: username,
                    author: 'test',
                    permlink: 'test',
                    weight: 10000,
                },
            ],
        ], //example of operation object for vote
        extensions: [], //extensions for this transaction
    };
    try {
        let privateKey = PrivateKey.fromString(key);

        let stx = client.broadcast.sign(op, privateKey);


        const rv = await client.database.verifyAuthority(stx);

        return rv ? true : false
    } catch (error) {
        throw new AuthenticationError('کلید یا نام کاربری نامعتبر')
    }
}

async function vote(username, key, author, permlink) {
    let op = {
        ref_block_num: head_block_number,
        ref_block_prefix: Buffer.from(head_block_id, 'hex').readUInt32LE(4),
        expiration: new Date(Date.now() + expireTime)
            .toISOString()
            .slice(0, -5),
        operations: [
            [
                'vote',
                {
                    voter: username,
                    author,
                    permlink,
                    weight: 10000,

                },
            ],
        ],
        extensions: [],
    };
    try {
        let privateKey = PrivateKey.fromString(key);

        let stx = client.broadcast.sign(op, privateKey);

        await client.database.verifyAuthority(stx);
        const res = await client.broadcast.send(stx);
        console.log(res);

        return res ? true : false;

    } catch (error) {
        console.log(error);

        throw new AuthenticationError('عملیات ناموفق')
    }

}

module.exports = resolvers;
