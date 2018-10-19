"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const restify = require("restify");
const path = require("path");
const dotenv_1 = require("dotenv");
// Import required bot services.
// See https://aka.ms/bot-services to learn more about the different parts of a bot.
const botbuilder_1 = require("botbuilder");
// Import required bot configuration.
const botframework_config_1 = require("botframework-config");
// This bot's main dialog.
const bot_1 = require("./bot");
const legal_1 = require("./legal");
// Read botFilePath and botFileSecret from .env file.
const ENV_FILE = path.join(__dirname, '..', '.env');
const env = dotenv_1.config({ path: ENV_FILE });
// bot endpoint name as defined in .bot file
// See https://aka.ms/about-bot-file to learn more about .bot file its use and bot configuration .
const DEV_ENVIRONMENT = 'development';
// bot name as defined in .bot file
// See https://aka.ms/about-bot-file to learn more about .bot file its use and bot configuration.
const BOT_CONFIGURATION = (process.env.NODE_ENV || DEV_ENVIRONMENT);
// Create HTTP server.
let server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log(`\n${server.name} listening to ${server.url}`);
});
// .bot file path
const BOT_FILE = path.join(__dirname, '..', (process.env.botFilePath || ''));
// Read bot configuration from .bot file.
let botConfig;
try {
    botConfig = botframework_config_1.BotConfiguration.loadSync(BOT_FILE, process.env.botFileSecret);
}
catch (err) {
    console.error(`\nError reading bot file. Please ensure you have valid botFilePath and botFileSecret set for your environment.`);
    console.error(`\n - The botFileSecret is available under appsettings for your Azure Bot Service bot.`);
    console.error(`\n - If you are running this bot locally, consider adding a .env file with botFilePath and botFileSecret.\n\n`);
    process.exit();
}
// Get bot endpoint configuration by service name
const endpointConfig = botConfig.findServiceByNameOrId(BOT_CONFIGURATION);
// Create adapter.
// See https://aka.ms/about-bot-adapter to learn more about .bot file its use and bot configuration .
const adapter = new botbuilder_1.BotFrameworkAdapter({
    appId: endpointConfig.appId || process.env.microsoftAppID,
    appPassword: endpointConfig.appPassword || process.env.microsoftAppPassword
});
// Define a state store for your bot.
// See https://aka.ms/about-bot-state to learn more about using MemoryStorage.
// A bot requires a state store to persist the dialog and user state between messages.
const memoryStorage = new botbuilder_1.MemoryStorage();
// CAUTION: You must ensure your product environment has the NODE_ENV set
//          to use the Azure Blob storage or Azure Cosmos DB providers.
// const { BlobStorage } = require('botbuilder-azure');
// Storage configuration name or ID from .bot file
// const STORAGE_CONFIGURATION_ID = '<STORAGE-NAME-OR-ID-FROM-BOT-FILE>';
// // Default container name
// const DEFAULT_BOT_CONTAINER = '<DEFAULT-CONTAINER>';
// // Get service configuration
// const blobStorageConfig = botConfig.findServiceByNameOrId(STORAGE_CONFIGURATION_ID);
// const blobStorage = new BlobStorage({
//     containerName: (blobStorageConfig.container || DEFAULT_BOT_CONTAINER),
//     storageAccountOrConnectionString: blobStorageConfig.connectionString,
// });
// conversationState = new ConversationState(blobStorage);
// Create conversation state with in-memory storage provider.
const conversationState = new botbuilder_1.ConversationState(memoryStorage);
// Create the main dialog.
const myBot = new bot_1.MyBot(conversationState);
// Catch-all for errors.
adapter.onTurnError = (context, error) => __awaiter(this, void 0, void 0, function* () {
    // This check writes out errors to console log .vs. app insights.
    console.error(`\n [onTurnError]: ${error}`);
    // Send a message to the user
    context.sendActivity(`Oops. Something went wrong!`);
    // Clear out state
    yield conversationState.load(context);
    yield conversationState.clear(context);
    // Save state changes.
    yield conversationState.saveChanges(context);
});
// Listen for incoming requests.
server.post('/api/messages', (req, res) => {
    adapter.processActivity(req, res, (context) => __awaiter(this, void 0, void 0, function* () {
        // Route to main dialog.
        yield myBot.onTurn(context);
    }));
});
server.get('/terms-of-use', (req, res) => {
    res.header('Content-Type', 'text/html');
    res.write(legal_1.TERMS);
    res.end();
});
server.get('/privacy-policy', (req, res) => {
    res.header('Content-Type', 'text/html');
    res.write(legal_1.POLICY);
    res.end();
});
//# sourceMappingURL=index.js.map