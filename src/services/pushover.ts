import axios from 'axios';

async function push(message: string) {
    await axios.post('https://api.pushover.net/1/messages.json', {
        token: process.env.PUSH_OVER_TOKEN || 'agm94q8ib29yy9c5n7proe7gz792u5',
        user: process.env.PUSH_OVER_USER || 'udr4uk5rnrpcrnimog4ennzecccpcm',
        message: message
    });
}

export default push;