const {
    gql
} = require('apollo-server');


const type = gql `

    type Query {
        getParentsPost(username:String!) : [Post]
        getFeeds(username:String!) : [Post]
        getCommentsFeed(author :String! , permlink : String! ) : [Comment]
        getUserAvatar(username:String!) : String
        loginUser(username : String! , activeKey : String!) : Boolean!

    }

    type Mutation {
       voteUser(username : String! , activeKey : String! , author :String! , permlink : String! ) : Boolean!

    }

    type Post {
        post_id : Int
        title : String
        author : String
        body: String
        pending_payout_value : String
        permlink : String
        json_metadata : String
        created : String
        avatar : String
        active_votes : [Voter]
    }

    type Comment{
        author : String
        body: String
        title : String
        created : String
        avatar : String
        active_votes : [Voter]
    }

    type Voter {
        voter : String
        rshares : String
        percent : String
        reputation : String
    }

    

`
module.exports = type;
