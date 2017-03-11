/*Store all configuration in this file. Allows us to reuse this anywhere by importing, and only have to change it in one place.*/
exports.config = {
    db_config:{
        host:"localhost",
        poolSize:20
    },

    base_api_url:'http://yugiohprices.com/api/',

    static_content: "../static/"
};
