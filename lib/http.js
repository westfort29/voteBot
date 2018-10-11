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
const IMG_API_KEY = process.env.IMG_API_MASHAPE_KEY;
const URL = "https://contextualwebsearch-websearch-v1.p.mashape.com/api/Search/ImageSearchAPI?count=1&autoCorrect=true&q=";
function getImage(query) {
    return __awaiter(this, void 0, void 0, function* () {
        let url = URL + normalizeQuery(query);
        console.log(IMG_API_KEY);
        const res = yield axios_1.default({
            method: "GET",
            headers: {
                "X-Mashape-Key": IMG_API_KEY,
                "X-Mashape-Host": "contextualwebsearch-websearch-v1.p.mashape.com"
            },
            url: url
        }).catch((e) => {
            return {
                data: {
                    value: [
                        { url: '' }
                    ]
                }
            };
        });
        return '' /* await (res.data.value[0] && res.data.value[0].url || '') */;
    });
}
exports.getImage = getImage;
function normalizeQuery(query) {
    return query.trim().split(' ').join('+');
}
//# sourceMappingURL=http.js.map