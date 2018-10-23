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
const IMG_API_KEY = 'vCZua7FQOHmshDmwmPLuOVEvxBJPp1vNDd5jsn9m38Zu8v89Bb';
const URL = "https://pixabay.com/api/?key=10475952-b00fff90aada76a86776caf63&safesearch=true&q=overwatch";
function getImage(query) {
    return __awaiter(this, void 0, void 0, function* () {
        let url = URL + normalizeQuery(query);
        const res = yield axios_1.default({
            method: "GET",
            url: url
        }).catch(() => {
            return {
                data: {
                    hits: [
                        {
                            webformatURL: ''
                        }
                    ]
                }
            };
        });
        return yield (res.data.hits && res.data.hits[0].webformatURL);
    });
}
exports.getImage = getImage;
function normalizeQuery(query) {
    return query.trim().split(' ').join('+');
}
//# sourceMappingURL=http.js.map