/***************************************************************************
 * FortifyJS - Secure Array Types
 *
 * This file contains type definitions for the SecureArray modular architecture
 *
 * @author Nehonix
 * @license MIT
 *
 * Copyright (c) 2025 Nehonix. All rights reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 ***************************************************************************** */

/**
 * CommonJS Export Module
 *
 */
// imports
import * as fObjectUtils from "./security/secure-object";
import * as fstringUtils from "./security/secure-string";
import * as fArrayUtils from "./security/secure-array";
import * as fFuncUtils from "./utils/fortified-function";
import * as CacheUtils from "./security/cache";
import * as SecurityExports from "./security";
import * as EncodingExports from "./utils/encoding";
import { FortifyJS } from "./core/crypto";
import { SecureString } from "./security/secure-string";
import { SecureObject } from "./security/secure-object";
import { SecureArray } from "./security/secure-array";
import { SecureRandom } from "./core/random";
import { RandomCrypto, RandomTokens } from "./core/random";
import { Hash } from "./core/hash";
import { Keys } from "./core/keys";
import { Validators } from "./core/validators";
import { SecureBuffer } from "./security";
import { EnhancedUint8Array } from "./helpers/Uint8Array";
import { PasswordManager } from "./core/password";
import {
    PasswordAlgorithm,
    PasswordSecurityLevel,
} from "./core/password/password-types";
import { encryptSecurePass, verifyEncryptedPassword } from "./index";
import { fString, fObject, fArray } from "./index";
import { pm } from "./index";

// cjs exports
export function cjsExports() {
    if (typeof module !== "undefined" && module.exports) {
        //default
        module.exports.default = FortifyJS;
        //
        module.exports = FortifyJS;
        module.exports.FortifyJS = FortifyJS;
        module.exports.ftfy = FortifyJS;
        module.exports.Fortify = FortifyJS;
        module.exports.pm = pm;

        // Export SecureRandom class and methods
        module.exports.SecureRandom = SecureRandom;
        module.exports.Random = SecureRandom;

        // Export individual methods for direct access (using correct modular classes)
        module.exports.createSecureCipheriv = RandomCrypto.createSecureCipheriv;
        module.exports.createSecureDecipheriv =
            RandomCrypto.createSecureDecipheriv;
        module.exports.generateSecureIV = RandomCrypto.generateSecureIV;
        module.exports.generateSecureIVBatch =
            RandomCrypto.generateSecureIVBatch;
        module.exports.generateSecureIVForAlgorithm =
            RandomCrypto.generateSecureIVForAlgorithm;
        module.exports.generateSecureIVBatchForAlgorithm =
            RandomCrypto.generateSecureIVBatchForAlgorithm;
        module.exports.validateIV = RandomCrypto.validateIV;
        module.exports.getRandomBytes = SecureRandom.getRandomBytes;
        module.exports.generateSessionToken = RandomTokens.generateSessionToken;
        module.exports.generateSecureUUID = SecureRandom.generateSecureUUID;

        // Export Hash methods (consolidated from SecureRandom)
        module.exports.createSecureHash = Hash.createSecureHash;
        module.exports.createSecureHMAC = Hash.createSecureHMAC;
        module.exports.verifyHash = Hash.verifyHash;

        // Export other core classes
        module.exports.Hash = Hash;
        module.exports.Keys = Keys;
        module.exports.Validators = Validators;
        module.exports.SecureBuffer = SecureBuffer;
        module.exports.Buffer = SecureBuffer;
        module.exports.EnhancedUint8Array = EnhancedUint8Array;

        // Export Password Management System
        module.exports.PasswordManager = PasswordManager;

        // Export Password Management Types and Enums (using imported modules)
        module.exports.PasswordAlgorithm = PasswordAlgorithm;
        module.exports.PasswordSecurityLevel = PasswordSecurityLevel;

        // Export new password utility functions
        module.exports.encryptSecurePass = encryptSecurePass;
        module.exports.verifyEncryptedPassword = verifyEncryptedPassword;

        // ===================== safe (String and Object) ====================

        // Export String, Object, Array, and Function utilities
        module.exports.fString = fString;
        module.exports.fObject = fObject;
        module.exports.fArray = fArray;
        module.exports.func = fFuncUtils.func;

        // Export fortified function utilities (using imported modules)
        module.exports.createFortifiedFunction =
            fFuncUtils.createFortifiedFunction;
        module.exports.FortifiedFunction = fFuncUtils.FortifiedFunction;

        // Export Security Features (using imported modules)
        globalThis.Object.keys(SecurityExports).forEach((key: string) => {
            if (key !== "default") {
                module.exports[key] = (SecurityExports as any)[key];
            }
        });

        // Export Security Features (using imported modules)
        globalThis.Object.keys(fstringUtils).forEach((key: string) => {
            if (key !== "default") {
                module.exports[key] = (fstringUtils as any)[key];
            }
        });
        globalThis.Object.keys(fObjectUtils).forEach((key: string) => {
            if (key !== "default") {
                module.exports[key] = (fObjectUtils as any)[key];
            }
        });
        globalThis.Object.keys(fArrayUtils).forEach((key: string) => {
            if (key !== "default") {
                module.exports[key] = (fArrayUtils as any)[key];
            }
        });

        // Export Utils/Encoding (using imported modules)
        globalThis.Object.keys(EncodingExports).forEach((key: string) => {
            if (key !== "default") {
                module.exports[key] = (EncodingExports as any)[key];
            }
        });

        // Export SecureString, SecureObject, and SecureArray classes
        module.exports.SecureString = SecureString;
        module.exports.SecureObject = SecureObject;
        module.exports.SecureArray = SecureArray;

        // ======================= v4.x.y =================
        // Cache system
        globalThis.Object.keys(CacheUtils).forEach((key: string) => {
            if (key !== "default") {
                module.exports[key] = (CacheUtils as any)[key];
            }
        });
    }
}
