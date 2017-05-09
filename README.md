# card-importer
Node.js express web server with a simple mustache templated UI, used for importing card/set information from the yugiohprices REST API for manipulation and storage in a mongoDB database.

After cloning the project, run: 'npm install' from cmd in this directory. This will install the node_modules specified in the package.json file in this directory and needed for the application to run.

#Local MongoDB instance
This app requires a running local MongoDB instance to run, otherwise it will fatally error on startup. To do this, make sure you have MongoDB downloaded from https://www.mongodb.com/
onto your local machine. From this installed directory, navigate into the bin directory and execute mongod --dbpath path/to/directory
