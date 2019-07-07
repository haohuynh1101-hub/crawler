const fetch = require("node-fetch");

const getProxyFromAPI = async url => {
    try {

        const response = await fetch(url);
        const json = await response.json();
        return json.proxy

    } catch (error) {
        console.log('err when get proxy from api ' + error);
    }
};

module.exports = getProxyFromAPI;