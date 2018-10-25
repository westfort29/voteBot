"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = require("axios");
const URL = "https://pixabay.com/api/?key=10475952-b00fff90aada76a86776caf63&safesearch=true&q=";
const RUSSIAN_REG_EXP = /[а-яА-ЯЁё]/;
function getImage(query) {
    return __awaiter(this, void 0, void 0, function* () {
        let url = URL + normalizeQuery(query);
        url += RUSSIAN_REG_EXP.test(query) ? `&lang=ru` : '';
        return axios_1.default(url)
            .then((data) => data.data.hits[0] && data.data.hits[0].webformatURL)
            .catch((e) => { console.log(e); return ''; });
    });
}
exports.getImage = getImage;
function normalizeQuery(query) {
    return encodeURI(query.trim().split(' ').join('+'));
}
//# sourceMappingURL=http.js.map