// config/auth.js

// expose our config directly to our application using module.exports
module.exports = {

    'facebookAuth' : {
        'clientID'        : '412605235610852', // your App ID
        'clientSecret'    : '89a3171d5af15bc45f8991b974746d9d', // your App Secret
        'callbackURL'     : '/app/auth/facebook/callback'
    },

    'twitterAuth' : {
        'consumerKey'        : 'wYJgMjhHgE1Maj9CYqyTM8w89',
        'consumerSecret'     : 'xZBAMd1crFQdciVzRtIuh4IHc6dUgRv9CWmcZtKt3gCqlDGw3c',
        'callbackURL'        : '/app/auth/twitter/callback'
    }

};
