(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["ZUnoCompiler"] = factory();
	else
		root["ZUnoCompiler"] = factory();
})(self, () => {
return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ([
/* 0 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ZUnoCompilerClass = void 0;
const qrcode_1 = __webpack_require__(1);
class ZUnoCompilerClass {
    constructor(code, freq, sec, main_pow, cbk = null) {
        this.SOF_CODE = 0x01;
        this.NACK_CODE = 0x15;
        this.CAN_CODE = 0x18;
        this.ACK_CODE = 0x06;
        this.REQUEST_CODE = 0x00;
        this.RECV_OK = 0x00;
        this.RECV_NOACK = 0x01;
        this.RECV_INVALIDDATALEN = 0x02;
        this.RECV_INVALIDCRC = 0x03;
        this.RECV_NOSOF = 0x05;
        this.dtr_timeout = 250;
        this.rcv_sof_timeout = 3500;
        this.ADDITIONAL_SIZE = 3;
        this.ZUNO_HEADER_PREAMBL = "ZMEZUNOC";
        this.SK_START_OFFSET_OLD = 0x30000;
        this.SK_HEADER_SIZE = 0xC0;
        this.SK_HEADER_VERSION_MSB_OFFSET = 0x08;
        this.SK_HEADER_VERSION_LSB_OFFSET = 0x09;
        this.SK_HEADER_NAME_START = 56;
        this.SK_HEADER_MAX_NAME = 47;
        this.SK_HEADER_HWREW_OFFSET = this.SK_HEADER_NAME_START + this.SK_HEADER_MAX_NAME + 1;
        this.ZUNO_LIC_FLAGS_NAMES_MAX_POWER = 4;
        this.MAX_DEFAULT_RF_POWER = 50;
        this.COM_PORT_FILTERS = [{ usbVendorId: 0x10c4, usbProductId: 0xea60 }];
        this.ZUNO_BAUD = [230400, 230400 * 2, 230400 * 4, 115200];
        this.CRC_POLY = 0x1021;
        this.variable_self = undefined;
        this.xhr_compile = undefined;
        this.xhr_version = undefined;
        this.xhr_bootloader = undefined;
        this.progressCbk = cbk;
        this.promise_wait = this.sketch(this, code, freq, sec, main_pow);
    }
    progress(variable_this, severity, message) {
        if (variable_this.progressCbk != null) {
            variable_this.progressCbk(severity, message);
        }
    }
    calcSigmaCRC16(variable_this, crc, data, offset, llen) {
        let new_bit, wrk_data, b, a, bit_mask;
        const bin_data = data;
        while (llen != 0) {
            llen -= 1;
            if (offset >= bin_data.length)
                wrk_data = 0xFF;
            else
                wrk_data = bin_data[offset];
            offset += 1;
            bit_mask = 0x80;
            while (bit_mask != 0) {
                a = 0;
                b = 0;
                if ((wrk_data & bit_mask) != 0)
                    a = 1;
                if ((crc & 0x8000) != 0)
                    b = 1;
                new_bit = a ^ b;
                crc <<= 1;
                crc = crc & 0xffff;
                if (new_bit == 1) {
                    crc ^= variable_this.CRC_POLY;
                }
                bit_mask >>= 1;
            }
        }
        return (crc);
    }
    Checksum(data) {
        let ret = 0xff;
        let i = 0x0;
        while (i < data.length) {
            ret = ret ^ data[i];
            i++;
        }
        return (ret);
    }
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    write(variable_this, variable_self, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const data_uint8 = new Uint8Array(data);
            const writer = variable_self["port"].writable.getWriter();
            yield writer.write(data_uint8);
            writer.releaseLock();
        });
    }
    sendNack(variable_this, variable_self) {
        return __awaiter(this, void 0, void 0, function* () {
            yield variable_this.write(variable_this, variable_self, [variable_this.NACK_CODE]);
        });
    }
    sendAck(variable_this, variable_self) {
        return __awaiter(this, void 0, void 0, function* () {
            yield variable_this.write(variable_this, variable_self, [variable_this.ACK_CODE]);
        });
    }
    readWithTimeout(variable_this, variable_self, timeout) {
        return __awaiter(this, void 0, void 0, function* () {
            let out;
            const reader = variable_self["port"].readable.getReader();
            const timer = setTimeout(() => {
                reader.releaseLock();
            }, timeout);
            try {
                out = (yield reader.read()).value;
            }
            catch (err) {
                out = new Uint8Array([]);
            }
            // console.debug("<<", out);
            clearTimeout(timer);
            reader.releaseLock();
            return (out);
        });
    }
    read(variable_this, variable_self, num) {
        return __awaiter(this, void 0, void 0, function* () {
            let out, i, rep, tempos;
            rep = 0x0;
            while (rep < 10) {
                if (variable_self["queue"].length >= num) {
                    out = [];
                    i = 0x0;
                    while (i < num) {
                        tempos = variable_self["queue"].shift();
                        if (tempos == undefined)
                            break;
                        out.push(tempos);
                        i++;
                    }
                    return (out);
                }
                const value = yield variable_this.readWithTimeout(variable_this, variable_self, 100);
                i = 0x0;
                while (i < value.byteLength) {
                    variable_self["queue"].push(value[i]);
                    i++;
                }
                rep++;
            }
            if (num >= variable_self["queue"].length)
                num = variable_self["queue"].length;
            out = [];
            i = 0x0;
            while (i < num) {
                tempos = variable_self["queue"].shift();
                if (tempos == undefined)
                    break;
                out.push(tempos);
                i++;
            }
            return (out);
        });
    }
    clear(variable_this, variable_self) {
        return __awaiter(this, void 0, void 0, function* () {
            while (true) {
                const value = yield variable_this.readWithTimeout(variable_this, variable_self, 100);
                if (value.length == 0x0)
                    return;
            }
        });
    }
    waitSOF(variable_this, variable_self) {
        return __awaiter(this, void 0, void 0, function* () {
            const sof_timeout = Date.now() + variable_this.rcv_sof_timeout;
            while (sof_timeout > Date.now()) {
                const sof = yield variable_this.read(variable_this, variable_self, 0x1);
                if (sof.length == 0x0) {
                    yield variable_this.sleep(100);
                    continue;
                }
                if (sof[0x0] == variable_this.SOF_CODE)
                    return (true);
                yield variable_this.sleep(200);
            }
            return (false);
        });
    }
    recvIncomingRequest(variable_this, variable_self) {
        return __awaiter(this, void 0, void 0, function* () {
            let buff_data;
            if ((yield variable_this.waitSOF(variable_this, variable_self)) == false)
                return ([variable_this.RECV_NOSOF]);
            buff_data = yield variable_this.read(variable_this, variable_self, 0x1);
            if (buff_data.length == 0x0)
                return ([variable_this.RECV_NOSOF]);
            const len_data = buff_data[0x0];
            buff_data = yield variable_this.read(variable_this, variable_self, len_data);
            if (buff_data.length != len_data) {
                yield variable_this.sendNack(variable_this, variable_self);
                return ([variable_this.RECV_INVALIDDATALEN]);
            }
            const check_buff = [len_data].concat(buff_data.slice(0, len_data - 0x1));
            const check_sum = variable_this.Checksum(check_buff);
            if (check_sum != buff_data[len_data - 1]) {
                yield variable_this.sendNack(variable_this, variable_self);
                return ([variable_this.RECV_INVALIDCRC]);
            }
            yield variable_this.sendAck(variable_this, variable_self);
            return ([variable_this.RECV_OK].concat(check_buff));
        });
    }
    resyncZunoPort(variable_this, variable_self) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield variable_this.recvIncomingRequest(variable_this, variable_self);
            if (data[0x0] != variable_this.RECV_OK)
                return (false);
            return (true);
        });
    }
    sendData(variable_this, variable_self, cmd, databuff, have_callback = false) {
        return __awaiter(this, void 0, void 0, function* () {
            let final_data, data_len;
            data_len = databuff.length + variable_this.ADDITIONAL_SIZE;
            if (have_callback == true)
                data_len++;
            if (data_len > 255) {
                const crc_data = [0x00, variable_this.REQUEST_CODE, cmd].concat(databuff);
                final_data = [0x00, (data_len >> 8) & 0x0FF, data_len & 0x0FF, variable_this.REQUEST_CODE, cmd].concat(databuff);
                if (have_callback == true)
                    final_data = final_data.concat([variable_self["seqNo"]]);
                const crc16 = variable_this.calcSigmaCRC16(variable_this, 0x1D0F, crc_data, 0, crc_data.length);
                final_data = [variable_this.SOF_CODE].concat(final_data).concat([(crc16 >> 8) & 0xFF, (crc16) & 0xFF]);
                yield variable_this.write(variable_this, variable_self, final_data);
                variable_self["seqNo"] += 1;
                variable_self["seqNo"] &= 0XFF; // 1 byte
                return;
            }
            final_data = [data_len & 0x0FF, variable_this.REQUEST_CODE, cmd].concat(databuff);
            if (have_callback == true)
                final_data = final_data.concat([variable_self["seqNo"]]);
            const crc = variable_this.Checksum(final_data);
            final_data = [variable_this.SOF_CODE].concat(final_data).concat([crc]);
            yield variable_this.write(variable_this, variable_self, final_data);
            variable_self["seqNo"] += 1;
            variable_self["seqNo"] &= 0XFF; // 1 byte
        });
    }
    sendCommandUnSz(variable_this, variable_self, cmd, databuff, have_callback = false, retries = 0x3) {
        return __awaiter(this, void 0, void 0, function* () {
            let rbuff;
            yield variable_this.clear(variable_this, variable_self);
            while (true) {
                yield variable_this.sendData(variable_this, variable_self, cmd, databuff, have_callback);
                rbuff = yield variable_this.read(variable_this, variable_self, 0x1);
                if (rbuff.length == 0x0)
                    return ([variable_this.RECV_NOACK]);
                if (rbuff[0] == variable_this.ACK_CODE)
                    break;
                if (rbuff[0] == variable_this.CAN_CODE) {
                    // console.warn("!!!CANCODE");
                    yield variable_this.recvIncomingRequest(variable_this, variable_self);
                    retries -= 1;
                    if (retries > 0)
                        continue;
                }
                if (rbuff[0] == variable_this.NACK_CODE) {
                    // console.debug("!!!NACK");
                    retries -= 1;
                    if (retries > 0)
                        continue;
                }
                return ([variable_this.RECV_NOACK]);
            }
            const result = yield variable_this.recvIncomingRequest(variable_this, variable_self);
            return (result);
        });
    }
    readNVM(variable_this, variable_self, addr, size) {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield variable_this.sendCommandUnSz(variable_this, variable_self, 0x2A, [(addr >> 16) & 0xFF, (addr >> 8) & 0xFF, addr & 0xFF, (size >> 8) & 0xFF, size & 0xFF], false));
        });
    }
    writeNVM(variable_this, variable_self, addr, buff) {
        return __awaiter(this, void 0, void 0, function* () {
            const size = buff.length;
            const data_addr = [(addr >> 16) & 0xFF, (addr >> 8) & 0xFF, addr & 0xFF, (size >> 8) & 0xFF, size & 0xFF];
            return (yield variable_this.sendCommandUnSz(variable_this, variable_self, 0x2B, data_addr.concat(buff), false));
        });
    }
    checkBootImage(variable_this, variable_self) {
        return __awaiter(this, void 0, void 0, function* () {
            return (variable_this.sendCommandUnSz(variable_this, variable_self, 0x08, [0x04], false));
        });
    }
    softReset(variable_this, variable_self) {
        return __awaiter(this, void 0, void 0, function* () {
            return (variable_this.sendCommandUnSz(variable_this, variable_self, 0x08, [], false));
        });
    }
    pushSketch(variable_this, variable_self, addr, size, crc16) {
        return __awaiter(this, void 0, void 0, function* () {
            return variable_this.sendCommandUnSz(variable_this, variable_self, 0x08, [0x01, (addr >> 16) & 0xFF, (addr >> 8) & 0xFF, addr & 0xFF, (size >> 8) & 0xFF, size & 0xFF, (crc16 >> 8) & 0xFF, (crc16) & 0xFF], false);
        });
    }
    freq_int_to_str(val) {
        let i = 0x0;
        while (i < ZUnoCompilerClass.FREQ_TABLE_U7.length) {
            if (ZUnoCompilerClass.FREQ_TABLE_U7[i].id == val)
                return (ZUnoCompilerClass.FREQ_TABLE_U7[i].name);
            i++;
        }
        return (null);
    }
    freq_str_to_int(val) {
        let i = 0x0;
        if (val == null)
            return (null);
        while (i < ZUnoCompilerClass.FREQ_TABLE_U7.length) {
            if (ZUnoCompilerClass.FREQ_TABLE_U7[i].name == val)
                return (ZUnoCompilerClass.FREQ_TABLE_U7[i].id);
            i++;
        }
        return (null);
    }
    zme_costruct_int(arr, n, inv = true) {
        let val, i, indx;
        val = 0;
        i = 0x0;
        while (i < arr.length) {
            val <<= 8;
            indx = i;
            if (inv == true)
                indx = n - 1 - i;
            if ((indx < arr.length) && (indx >= 0))
                val += arr[indx];
            i++;
        }
        return (val);
    }
    readBoardInfoCheckFlag(lic_flags, flag_bit) {
        const byte = ((flag_bit - (flag_bit % 0x8)) / 0x8);
        if (lic_flags.length < byte)
            return (false);
        const flag = lic_flags[byte];
        if ((flag & (0x1 << (flag_bit % 0x8))) == 0x0)
            return (false);
        return (true);
    }
    conv2Decimal(variable_this, buff, separator = "-") {
        let i, text, v;
        text = "";
        i = 0x0;
        while (i < (buff.length / 2)) {
            v = buff[(i * 2)];
            v <<= 8;
            v += buff[(i * 2) + 1];
            if (i != 0)
                text += separator;
            text += variable_this._compile_zwave_qrcode_padding(v, 5);
            i = i + 1;
        }
        return (text);
    }
    _compile_zwave_qrcode_padding(num, max) {
        let num_str = num.toString(0xA);
        while (num_str.length < max)
            num_str = '0' + num_str;
        return (num_str);
    }
    compile_zwave_qrcode(variable_this, product_data, dsk, version) {
        return __awaiter(this, void 0, void 0, function* () {
            let protocol_map, text;
            text = variable_this._compile_zwave_qrcode_padding(product_data["s2_keys"], 3);
            text = text + variable_this.conv2Decimal(variable_this, dsk, "");
            // #ProductType
            text = text + "0010" + variable_this._compile_zwave_qrcode_padding(product_data["device_type"], 5) + variable_this._compile_zwave_qrcode_padding(product_data["device_icon"], 5);
            // #ProductID
            text = text + "0220" + variable_this._compile_zwave_qrcode_padding(product_data["vendor"], 5) + variable_this._compile_zwave_qrcode_padding(product_data["product_type"], 5) +
                variable_this._compile_zwave_qrcode_padding(product_data["product_id"], 5) + variable_this._compile_zwave_qrcode_padding(version, 5);
            // # Supported Protocols
            protocol_map = 0x01;
            if (product_data["LR"] == true)
                protocol_map = protocol_map | 0x02;
            text += "0803" + variable_this._compile_zwave_qrcode_padding(protocol_map, 3);
            // # MaxInclusionInterval
            text = text + "0403005"; // # ==5*128=640
            const buf = Uint8Array.from(unescape(encodeURIComponent(text)), c => c.charCodeAt(0)).buffer;
            const digest = new Uint8Array(yield crypto.subtle.digest('SHA-1', buf));
            text = "9001" + variable_this._compile_zwave_qrcode_padding((digest[0x0] << 0x8) | digest[0x1], 5) + text;
            return (text);
        });
    }
    toString(array) {
        let result;
        result = "";
        for (let i = 0; i < array.length; i++) {
            result += String.fromCharCode(array[i]);
        }
        return result;
    }
    readBoardInfo(variable_this, variable_self) {
        return __awaiter(this, void 0, void 0, function* () {
            let bLR, param_info, code_sz_shift, shift_smrt, lic_flags;
            const md = {};
            const info = yield variable_this.readNVM(variable_this, variable_self, 0xFFFF00, 0x01);
            if (info.length < 10)
                return (md);
            param_info = yield variable_this.readNVM(variable_this, variable_self, 0xFFE000, 0x09);
            if (param_info.length < 10)
                return (md);
            bLR = false;
            param_info = param_info.slice(4, param_info.length);
            const r = variable_this.freq_int_to_str(param_info[1]);
            if (r == null)
                return (md);
            if (r != null)
                if ((r == "US_LR") || (r == "US") || (r == "US_LR_BK"))
                    bLR = true;
            md["freq_i"] = param_info[1];
            md["freq_str"] = r;
            const bts = info.slice(4, info.length);
            md["version"] = (bts[0] << 8) | (bts[1]);
            md["build_number"] = (bts[2] << 24) | (bts[3] << 16) | (bts[4] << 8) | (bts[5]);
            md["build_ts"] = (bts[6] << 24) | (bts[7] << 16) | (bts[8] << 8) | (bts[9]);
            md["hw_rev"] = (bts[10] << 8) | (bts[11]);
            code_sz_shift = 0;
            if (md["build_number"] > 1116) {
                code_sz_shift = 1;
                md["code_size"] = variable_this.zme_costruct_int(bts.slice(12, 12 + 3), 3, false);
            }
            else
                md["code_size"] = (bts[12] << 8) | (bts[13]);
            md["ram_size"] = (bts[14 + code_sz_shift] << 8) | (bts[15 + code_sz_shift]);
            md["chip_uid"] = bts.slice(16 + code_sz_shift, 16 + code_sz_shift + 8);
            md["s2_pub"] = bts.slice(24 + code_sz_shift, 24 + code_sz_shift + 16);
            md["dsk"] = variable_this.conv2Decimal(variable_this, md["s2_pub"], "-");
            md["dbg_lock"] = 0xFF;
            md["home_id"] = 0;
            md["node_id"] = 0;
            md["custom_code_offset"] = variable_this.SK_START_OFFSET_OLD;
            if (bts.length > (44 + code_sz_shift)) {
                md["dbg_lock"] = bts[40 + code_sz_shift];
                md["home_id"] = variable_this.zme_costruct_int(bts.slice(41 + code_sz_shift, 41 + code_sz_shift + 4), 4, false);
                md["node_id"] = bts[45 + code_sz_shift];
            }
            shift_smrt = 11;
            if (bts.length > (46 + code_sz_shift)) {
                if (md["build_number"] < 1669) {
                    shift_smrt = 90;
                    md["smart_qr"] = variable_this.toString(bts.slice(46 + code_sz_shift, 46 + code_sz_shift + 90));
                }
                else {
                    md["zwdata"] = {
                        "s2_keys": bts[46 + code_sz_shift],
                        "device_type": variable_this.zme_costruct_int(bts.slice(47 + code_sz_shift, 47 + code_sz_shift + 2), 2, false),
                        "device_icon": variable_this.zme_costruct_int(bts.slice(49 + code_sz_shift, 49 + code_sz_shift + 2), 2, false),
                        "vendor": variable_this.zme_costruct_int(bts.slice(51 + code_sz_shift, 51 + code_sz_shift + 2), 2, false),
                        "product_type": variable_this.zme_costruct_int(bts.slice(53 + code_sz_shift, 53 + code_sz_shift + 2), 2, false),
                        "product_id": variable_this.zme_costruct_int(bts.slice(55 + code_sz_shift, 55 + code_sz_shift + 2), 2, false),
                        "version": md["version"],
                        "LR": bLR,
                    };
                    md["smart_qr"] = yield variable_this.compile_zwave_qrcode(variable_this, md["zwdata"], md["s2_pub"], md["version"]);
                }
            }
            md["boot_offset"] = 0x3a000;
            if (bts.length > (46 + shift_smrt + code_sz_shift + 4)) {
                md["custom_code_offset"] = variable_this.zme_costruct_int(bts.slice(46 + code_sz_shift + shift_smrt, 46 + code_sz_shift + shift_smrt + 4), 4, false);
                if (md["custom_code_offset"] > 0x36000)
                    md["boot_offset"] = 0x40000;
            }
            md["max_default_power"] = variable_this.MAX_DEFAULT_RF_POWER;
            lic_flags = [0];
            if (bts.length > (46 + shift_smrt + code_sz_shift + 8)) {
                const prod_shift = 46 + code_sz_shift + shift_smrt + 4;
                const lic_shift = prod_shift + 8 + 4 + 4;
                lic_flags = bts.slice(lic_shift + 2, lic_shift + 2 + 8);
                if (bts.length > (lic_shift + 10) && md["build_number"] >= 2849)
                    md["max_default_power"] = bts[lic_shift + 10];
            }
            if (variable_this.readBoardInfoCheckFlag(lic_flags, variable_this.ZUNO_LIC_FLAGS_NAMES_MAX_POWER) == false)
                md["flag_max_power"] = false;
            else
                md["flag_max_power"] = true;
            md["param_info"] = param_info;
            return (md);
        });
    }
    freezeSketch(variable_this, variable_self) {
        return __awaiter(this, void 0, void 0, function* () {
            let sleep_time, rcv, retries;
            retries = 0x3;
            sleep_time = 10;
            if (navigator.platform == "Win32")
                sleep_time = 50;
            while (retries != 0x0) {
                rcv = yield variable_this.sendCommandUnSz(variable_this, variable_self, 0x08, [0x02], false);
                if (rcv.length > 4) {
                    if ((rcv[0] == variable_this.RECV_OK) && (rcv[3] == 0x08) && (rcv[4] == 0x00))
                        return (true);
                }
                yield variable_this.sleep(sleep_time);
                retries -= 1;
            }
            return (false);
        });
    }
    syncWithDevice(variable_this, variable_self) {
        return __awaiter(this, void 0, void 0, function* () {
            if ((yield variable_this.resyncZunoPort(variable_this, variable_self)) == false) {
                return (false);
            }
            if ((yield variable_this.freezeSketch(variable_this, variable_self)) == false) {
                return (false);
            }
            return (true);
        });
    }
    HeaderCmp(variable_this, header, core_version, hw_rev, build_number) {
        const data_uint8 = new Uint8Array(header.slice(0, variable_this.ZUNO_HEADER_PREAMBL.length));
        const string = new TextDecoder().decode(data_uint8);
        if (variable_this.ZUNO_HEADER_PREAMBL != string)
            return (false);
        const header_version = (header[variable_this.SK_HEADER_VERSION_MSB_OFFSET] << 8) | header[variable_this.SK_HEADER_VERSION_LSB_OFFSET];
        if (header_version != core_version)
            return (false);
        if (hw_rev != -1 && build_number >= 2849) {
            const header_hw_rev = variable_this.zme_costruct_int(header.slice(variable_this.SK_HEADER_HWREW_OFFSET, variable_this.SK_HEADER_HWREW_OFFSET + 0x2), 2);
            if (hw_rev != header_hw_rev)
                return (false);
        }
        return (true);
    }
    writeArrayToNVM(variable_this, variable_self, md, nvmaddr, array, data_offset = 0x0) {
        return __awaiter(this, void 0, void 0, function* () {
            let data_quant, offset, data_remains, len_send, buff, res;
            const ret_data = array;
            offset = data_offset;
            data_remains = ret_data.length - data_offset;
            data_quant = 240;
            if (md["build_number"] != undefined && md["build_number"] >= 3396)
                data_quant = 2048;
            while (data_remains != 0x0) {
                len_send = data_quant;
                if (data_remains < data_quant)
                    len_send = data_remains;
                buff = [];
                buff = buff.concat(ret_data.slice(offset, offset + len_send));
                if (buff.length == 1)
                    buff = buff.concat([0xFF]);
                res = yield variable_this.writeNVM(variable_this, variable_self, nvmaddr, buff);
                if (res[0] != variable_this.RECV_OK || res[4] != 1)
                    return (null);
                offset += len_send;
                data_remains -= len_send;
                nvmaddr += len_send;
            }
            return (ret_data);
        });
    }
    applyPrams(variable_this, variable_self, md) {
        return __awaiter(this, void 0, void 0, function* () {
            const bts = md["param_info"];
            if (bts == undefined || variable_self["paramtr"] == undefined)
                return (false);
            while (bts.length < 8)
                bts.push(0x0);
            bts[1] = variable_self["paramtr"]["freq"];
            if (bts.length > 8)
                bts[8] = variable_self["paramtr"]["freq"];
            bts[4] = variable_self["paramtr"]["sec"];
            bts[2] = variable_self["paramtr"]["main_pow"];
            const res = yield variable_this.writeNVM(variable_this, variable_self, 0xFFE000, bts);
            if (res[0] != variable_this.RECV_OK || res[4] != 1) {
                return (false);
            }
            return (true);
        });
    }
    waitFinware(variable_this, variable_self) {
        return __awaiter(this, void 0, void 0, function* () {
            const sof_timeout = Date.now() + 30000;
            while (sof_timeout > Date.now()) {
                const result = yield variable_this.recvIncomingRequest(variable_this, variable_self);
                if (result[0] == variable_this.RECV_OK) {
                    if (result.length < 6)
                        return (false);
                    if (result[3] != 0x08)
                        return (false);
                    if (result[5] != 0x01)
                        return (false);
                    return (true);
                }
                yield variable_this.sleep(100);
            }
            return (false);
        });
    }
    _base64ToArrayBuffer(base64) {
        const binaryString = atob(base64);
        const bytes = new Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
    }
    _xhr_compile(xhr, data, hw_str) {
        return new Promise(function (resolve, reject) {
            const formData = new FormData();
            formData.append("sketch", new File([new Blob([data])], "sketch", { lastModified: Date.now(), type: "text/x-arduino" }));
            formData.append("referer", document.location.href);
            const url = 'https://service.z-wave.me/z-uno-compilation-server/?compile&' + 'hw=' + hw_str;
            xhr.open("POST", url);
            xhr.responseType = 'json';
            xhr.timeout = 300000; //5 min
            xhr.ontimeout = function () {
                reject(Error("Request failed: Timed out"));
            };
            xhr.onload = function () {
                resolve(xhr.response);
            };
            xhr.onerror = function () {
                reject(Error("Request failed: Perhaps you have problems with the Internet"));
            };
            xhr.send(formData);
        });
    }
    _xhr_version(xhr) {
        return new Promise(function (resolve, reject) {
            xhr.open("POST", 'https://service.z-wave.me/z-uno-compilation-server/?version');
            xhr.responseType = 'json';
            xhr.timeout = 30000; //30 sec
            xhr.ontimeout = function () {
                reject(Error("Request failed: Timed out"));
            };
            xhr.onload = function () {
                resolve(xhr.response);
            };
            xhr.onerror = function () {
                reject(Error("Request failed: Perhaps you have problems with the Internet"));
            };
            xhr.send();
        });
    }
    _xhr_bootloader(xhr, hw_str, build_number) {
        return new Promise(function (resolve, reject) {
            const url = 'https://service.z-wave.me/z-uno-compilation-server/?bootloader&' + 'hw=' + hw_str + "&seq=" + build_number;
            xhr.open("POST", url);
            xhr.responseType = 'json';
            xhr.timeout = 30000; //30 sec
            xhr.ontimeout = function () {
                reject(Error("Request failed: Timed out"));
            };
            xhr.onload = function () {
                resolve(xhr.response);
            };
            xhr.onerror = function () {
                reject(Error("Request failed: Perhaps you have problems with the Internet"));
            };
            xhr.send();
        });
    }
    sketch_info(variable_this, message) {
        variable_this.progress(variable_this, "info", message);
    }
    sketch_error(variable_this, variable_self, reject, result) {
        return __awaiter(this, void 0, void 0, function* () {
            if (variable_self != null)
                yield variable_self["port"].close();
            variable_this.progress(variable_this, "error", result.message);
            reject(result);
        });
    }
    load_sketch(variable_this, variable_self, promise_compile, resolve, reject) {
        variable_this.sketch_info(variable_this, "Compiling the sketch...");
        promise_compile.then(function (result) {
            return __awaiter(this, void 0, void 0, function* () {
                let bin;
                try {
                    if (result["status"] != 0x0)
                        return (variable_this.sketch_error(variable_this, variable_self, reject, Error("Compilation returned incorrect status: " + result["status"] + " log: " + result["log"] + " message: " + result["message"])));
                    bin = variable_this._base64ToArrayBuffer(result["bin"]);
                }
                catch (error) {
                    return (variable_this.sketch_error(variable_this, variable_self, reject, Error("The structure obtained after compilation is not valid")));
                }
                variable_this.sketch_info(variable_this, "Compiling the sketch done");
                const md = variable_self["md"];
                if (md == undefined || md["version"] == undefined || md["hw_rev"] == undefined || md["build_number"] == undefined || md["custom_code_offset"] == undefined || md["code_size"] == undefined)
                    return (variable_this.sketch_error(variable_this, variable_self, reject, Error("Something unexpected happened and the variable turned out to be empty - contact support.")));
                const header = bin.slice(0, variable_this.SK_HEADER_SIZE);
                if (variable_this.HeaderCmp(variable_this, header, md["version"], md["hw_rev"], md["build_number"]) == false)
                    return (variable_this.sketch_error(variable_this, variable_self, reject, Error("The sketch and firmware version do not match")));
                if (bin.length > md["code_size"])
                    return (variable_this.sketch_error(variable_this, variable_self, reject, Error("Sketch size too large")));
                variable_this.sketch_info(variable_this, "Uploading the sketch...");
                if ((yield variable_this.applyPrams(variable_this, variable_self, md)) == false)
                    return (variable_this.sketch_error(variable_this, variable_self, reject, Error("Failed to apply settings")));
                const sk_data = yield variable_this.writeArrayToNVM(variable_this, variable_self, md, md["custom_code_offset"], bin);
                if (sk_data == null)
                    return (variable_this.sketch_error(variable_this, variable_self, reject, Error("Failed to upload sketch")));
                const crc16 = variable_this.calcSigmaCRC16(variable_this, 0x1D0F, sk_data, 0, sk_data.length);
                const res = yield variable_this.pushSketch(variable_this, variable_self, md["custom_code_offset"], sk_data.length, crc16);
                if (res[0] != variable_this.RECV_OK)
                    return (variable_this.sketch_error(variable_this, variable_self, reject, Error("Failed to apply sketch")));
                if (res[4] == 0xFE)
                    return (variable_this.sketch_error(variable_this, variable_self, reject, Error("Can't upload sketch! Something went wrong. Bad CRC16 :'( .")));
                yield variable_self["port"].close();
                variable_this.sketch_info(variable_this, "Uploading the sketch done");
                variable_this.sketch_info(variable_this, "QR code read...");
                yield variable_this.sleep(variable_this.dtr_timeout); // The time for the capacitor on the DTR line to recharge
                try {
                    yield variable_self["port"].open({ baudRate: variable_self["baudRate"], bufferSize: 8192 });
                }
                catch (e) {
                    return (variable_this.sketch_error(variable_this, null, reject, Error("Check yours, maybe another application is using it")));
                }
                if ((yield variable_this.syncWithDevice(variable_this, variable_self)) == false)
                    return (variable_this.sketch_error(variable_this, null, reject, Error("After a successful firmware update, it was not possible to re-sync with Z-Uno")));
                variable_self["md"] = yield variable_this.readBoardInfo(variable_this, variable_self);
                if (Object.keys(variable_self["md"]).length == 0x0)
                    return (variable_this.sketch_error(variable_this, variable_self, reject, Error("Failed to read board info")));
                yield variable_this.softReset(variable_this, variable_self);
                yield variable_self["port"].close();
                const out = {};
                out["dsk"] = variable_self["md"]["dsk"];
                if ("smart_qr" in variable_self["md"]) {
                    out["smart_qr"] = variable_self["md"]["smart_qr"];
                    variable_this.sketch_info(variable_this, "QR code read done");
                    resolve(out);
                    return;
                }
                return (variable_this.sketch_error(variable_this, variable_self, reject, Error("Failed to read QR code")));
            });
        }, function (err) {
            return __awaiter(this, void 0, void 0, function* () {
                return (variable_this.sketch_error(variable_this, variable_self, reject, err));
            });
        });
    }
    load_bootloader(variable_this, variable_self, promise_compile, resolve, reject, hw_str, build_number_str) {
        variable_this.sketch_info(variable_this, "Uploading a new bootloader to the Z-Uno...");
        const xhr_bootloader = new XMLHttpRequest();
        const promise_bootloader = variable_this._xhr_bootloader(xhr_bootloader, hw_str, build_number_str);
        variable_this.xhr_bootloader = xhr_bootloader;
        promise_bootloader.then(function (result) {
            return __awaiter(this, void 0, void 0, function* () {
                let bin;
                try {
                    if (result["status"] != 0x0)
                        return (variable_this.sketch_error(variable_this, variable_self, reject, Error("Get bootloader returned incorrect status: " + result["status"] + " log: " + result["log"] + " message: " + result["message"])));
                    bin = variable_this._base64ToArrayBuffer(result["bin"]);
                }
                catch (error) {
                    return (variable_this.sketch_error(variable_this, variable_self, reject, Error("The bootloader structure obtained after version is not valid")));
                }
                if (variable_self["md"] == undefined || variable_self["md"]["boot_offset"] == undefined)
                    return (variable_this.sketch_error(variable_this, variable_self, reject, Error("Something unexpected happened and the variable turned out to be empty - contact support.")));
                const sk_data = yield variable_this.writeArrayToNVM(variable_this, variable_self, variable_self["md"], variable_self["md"]["boot_offset"], bin);
                if (sk_data == null)
                    return (variable_this.sketch_error(variable_this, variable_self, reject, Error("Failed to upload firmware")));
                yield variable_this.checkBootImage(variable_this, variable_self);
                if ((yield variable_this.waitFinware(variable_this, variable_self)) == false)
                    return (variable_this.sketch_error(variable_this, variable_self, reject, Error("Something is wrong - the firmware could not be updated - there may be a problem with the version")));
                yield variable_this.waitFinware(variable_this, variable_self);
                yield variable_self["port"].close();
                yield variable_this.sleep(variable_this.dtr_timeout); // The time for the capacitor on the DTR line to recharge
                try {
                    yield variable_self["port"].open({ baudRate: variable_self["baudRate"], bufferSize: 8192 });
                }
                catch (e) {
                    return (variable_this.sketch_error(variable_this, null, reject, Error("Check yours, maybe another application is using it")));
                }
                if ((yield variable_this.syncWithDevice(variable_this, variable_self)) == false)
                    return (variable_this.sketch_error(variable_this, null, reject, Error("After a successful firmware update, it was not possible to re-sync with Z-Uno")));
                variable_self["md"] = yield variable_this.readBoardInfo(variable_this, variable_self);
                if (Object.keys(variable_self["md"]).length == 0x0)
                    return (variable_this.sketch_error(variable_this, variable_self, reject, Error("Failed to read board info")));
                if (Number(build_number_str) != variable_self["md"]["build_number"])
                    return (variable_this.sketch_error(variable_this, variable_self, reject, Error("Although the firmware was successfully updated, the actual version was no longer needed")));
                variable_this.sketch_info(variable_this, "Uploading a new bootloader to the Z-Uno done");
                return (variable_this.load_sketch(variable_this, variable_self, promise_compile, resolve, reject));
            });
        }, function (err) {
            return __awaiter(this, void 0, void 0, function* () {
                return (variable_this.sketch_error(variable_this, variable_self, reject, err));
            });
        });
    }
    sketch(variable_this, text_sketch, freq_str, sec, main_pow) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise(function (resolve, reject) {
                return __awaiter(this, void 0, void 0, function* () {
                    let i, hw_str, sec_prm, port;
                    const filters = variable_this.COM_PORT_FILTERS;
                    if (!navigator.serial || !navigator.serial.requestPort) {
                        return (variable_this.sketch_error(variable_this, null, reject, Error("Sorry, this feature is supported only on Chrome, Edge and Opera")));
                    }
                    try {
                        port = yield navigator.serial.requestPort({ filters });
                    }
                    catch (e) {
                        return (variable_this.sketch_error(variable_this, null, reject, Error("No port selected")));
                    }
                    try {
                        yield port.close(); //If the port was already opened by us, but for some reason we left without closing it
                    }
                    catch (e) {
                    }
                    variable_this.sketch_info(variable_this, "Determining the revision Z-Uno ...");
                    const variable_self = { "queue": [], "seqNo": 0x0, "port": port, "baudRate": 230400 };
                    variable_this.variable_self = variable_self;
                    i = 0x0;
                    while (i < variable_this.ZUNO_BAUD.length) {
                        try {
                            yield variable_self["port"].open({ baudRate: variable_this.ZUNO_BAUD[i], bufferSize: 8192 });
                        }
                        catch (e) {
                            return (variable_this.sketch_error(variable_this, null, reject, Error("Check yours, maybe another application is using it")));
                        }
                        if ((yield variable_this.syncWithDevice(variable_this, variable_self)) == true)
                            break;
                        yield variable_self["port"].close();
                        yield variable_this.sleep(variable_this.dtr_timeout); // The time for the capacitor on the DTR line to recharge
                        i++;
                    }
                    if (i >= variable_this.ZUNO_BAUD.length)
                        return (variable_this.sketch_error(variable_this, null, reject, Error("Failed to sync with Z-Uno")));
                    variable_self["baudRate"] = variable_this.ZUNO_BAUD[i];
                    variable_self["md"] = yield variable_this.readBoardInfo(variable_this, variable_self);
                    if (Object.keys(variable_self["md"]).length == 0x0)
                        return (variable_this.sketch_error(variable_this, variable_self, reject, Error("Failed to read board info")));
                    variable_this.sketch_info(variable_this, "Determining the revision Z-Uno done");
                    if (variable_self["md"]["freq_str"] == undefined)
                        return (variable_this.sketch_error(variable_this, variable_self, reject, Error("Something unexpected happened and the variable turned out to be empty - contact support.")));
                    if (freq_str == null)
                        freq_str = variable_self["md"]["freq_str"];
                    const freq = variable_this.freq_str_to_int(freq_str);
                    if (sec === true)
                        sec_prm = 0x1;
                    else if (sec === false)
                        sec_prm = 0x0;
                    else
                        return (variable_this.sketch_error(variable_this, null, reject, Error("The security parameter is incorrectly specified")));
                    if (variable_self["md"]["max_default_power"] == undefined)
                        return (variable_this.sketch_error(variable_this, variable_self, reject, Error("Something unexpected happened and the variable turned out to be empty - contact support.")));
                    if (main_pow < 0x1 || main_pow > 0xFF)
                        return (variable_this.sketch_error(variable_this, null, reject, Error("Radio power is out of range")));
                    if (freq == null)
                        return (variable_this.sketch_error(variable_this, null, reject, Error("The specified radio frequency is not supported")));
                    if (variable_self["md"]["flag_max_power"] == false) {
                        if (main_pow > variable_self["md"]["max_default_power"])
                            return (variable_this.sketch_error(variable_this, variable_self, reject, Error("Your license does not support this maximum radio power value.")));
                    }
                    variable_self["paramtr"] = {
                        "main_pow": main_pow,
                        "freq": freq,
                        "sec": sec_prm,
                    };
                    if (variable_self["md"]["hw_rev"] == undefined)
                        return (variable_this.sketch_error(variable_this, variable_self, reject, Error("Something unexpected happened and the variable turned out to be empty - contact support.")));
                    hw_str = variable_self["md"]["hw_rev"].toString(0x10);
                    while (hw_str.length < 0x4)
                        hw_str = '0' + hw_str;
                    variable_this.sketch_info(variable_this, "Checking Z-Uno version...");
                    const xhr_version = new XMLHttpRequest();
                    const promise_version = variable_this._xhr_version(xhr_version);
                    variable_this.xhr_version = xhr_version;
                    const xhr_compile = new XMLHttpRequest();
                    variable_this.xhr_compile = xhr_compile;
                    const promise_compile = variable_this._xhr_compile(xhr_compile, text_sketch, hw_str);
                    promise_version.then(function (result) {
                        return __awaiter(this, void 0, void 0, function* () {
                            let version_list;
                            try {
                                if (result["status"] != 0x0)
                                    return (variable_this.sketch_error(variable_this, variable_self, reject, Error("Get version returned incorrect status: " + result["status"] + " message: " + result["message"])));
                                version_list = result["version"]["hw"];
                            }
                            catch (error) {
                                return (variable_this.sketch_error(variable_this, variable_self, reject, Error("The version structure obtained after version is not valid")));
                            }
                            const build_number = version_list[hw_str].seq;
                            if (build_number === undefined)
                                return (variable_this.sketch_error(variable_this, variable_self, reject, Error("The server does not support the specified board revision")));
                            if (variable_self["md"] == undefined || variable_self["md"]["build_number"] == undefined)
                                return (variable_this.sketch_error(variable_this, variable_self, reject, Error("Something unexpected happened and the variable turned out to be empty - contact support.")));
                            if (variable_self["md"]["build_number"] > build_number)
                                return (variable_this.sketch_error(variable_this, variable_self, reject, Error("The firmware on the board is newer than on the server")));
                            variable_this.sketch_info(variable_this, "Checking Z-Uno version done");
                            if (variable_self["md"]["build_number"] != build_number)
                                return (variable_this.load_bootloader(variable_this, variable_self, promise_compile, resolve, reject, hw_str, String(build_number)));
                            return (variable_this.load_sketch(variable_this, variable_self, promise_compile, resolve, reject));
                        });
                    }, function (err) {
                        return __awaiter(this, void 0, void 0, function* () {
                            return (variable_this.sketch_error(variable_this, variable_self, reject, err));
                        });
                    });
                });
            });
        });
    }
    generateQrCode(variable_this, id, text) {
        let obj_QRCode;
        const option = {
            text: text,
            width: 256,
            height: 256,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: 1 /* QRErrorCorrectLevel.L */,
        };
        try {
            obj_QRCode = new qrcode_1.QRCode(id, option);
        }
        catch (e) {
            variable_this.progress(variable_this, "error", "Failed to create \"object QRCode\", check parameters.");
            return (false);
        }
        return (true);
    }
    getWait() {
        return this.promise_wait;
    }
    cancel() {
        try {
            if (this.variable_self != undefined)
                this.variable_self.port.close();
        }
        catch (err) {
        }
        try {
            if (this.xhr_version != undefined)
                this.xhr_version.abort();
        }
        catch (err) {
        }
        try {
            if (this.xhr_bootloader != undefined)
                this.xhr_bootloader.abort();
        }
        catch (err) {
        }
        try {
            if (this.xhr_compile != undefined)
                this.xhr_compile.abort();
        }
        catch (err) {
        }
    }
    /**
     * Draw the QR code of the board
     *
     * @param {*} id Id of the div tag that will host the QR-code image
     * @param {*} qrContent Content of the QR-code to be printed
     */
    drawQR(id, text) {
        return this.generateQrCode(this, id, text);
    }
    /**
     *
     * @returns List freq
     */
    static getFreqList() {
        let i;
        i = 0x0;
        const out = [];
        while (i < ZUnoCompilerClass.FREQ_TABLE_U7.length) {
            out.push(ZUnoCompilerClass.FREQ_TABLE_U7[i].name);
            i++;
        }
        return (out);
    }
}
exports.ZUnoCompilerClass = ZUnoCompilerClass;
ZUnoCompilerClass.FREQ_TABLE_U7 = [
    { name: "EU", id: 0x00 },
    { name: "US", id: 0x01 },
    { name: "ANZ", id: 0x02 },
    { name: "HK", id: 0x03 },
    // { name: "MY",id: 0x04},
    { name: "IN", id: 0x05 },
    { name: "IL", id: 0x06 },
    { name: "RU", id: 0x07 },
    { name: "CN", id: 0x08 },
    { name: "US_LR", id: 0x09 },
    // { name: "US_LR_BK",id: 0x0A},
    { name: "JP", id: 0x20 },
    { name: "KR", id: 0x21 },
    // { name: "FK",id: 0xFE},
];


/***/ }),
/* 1 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   QRCode: () => (/* binding */ QRCode)
/* harmony export */ });
/**
 * @fileoverview
 * - Using the 'QRCode for Javascript library'
 * - Fixed dataset of 'QRCode for Javascript library' for support full-spec.
 * - this library has no dependencies.
 * 
 * @author davidshimjs
 * @see <a href="http://www.d-project.com/" target="_blank">http://www.d-project.com/</a>
 * @see <a href="http://jeromeetienne.github.com/jquery-qrcode/" target="_blank">http://jeromeetienne.github.com/jquery-qrcode/</a>
 */

var QRCode;

(function () {
	//---------------------------------------------------------------------
	// QRCode for JavaScript
	//
	// Copyright (c) 2009 Kazuhiko Arase
	//
	// URL: http://www.d-project.com/
	//
	// Licensed under the MIT license:
	//   http://www.opensource.org/licenses/mit-license.php
	//
	// The word "QR Code" is registered trademark of 
	// DENSO WAVE INCORPORATED
	//   http://www.denso-wave.com/qrcode/faqpatent-e.html
	//
	//---------------------------------------------------------------------
	function QR8bitByte(data) {
		this.mode = QRMode.MODE_8BIT_BYTE;
		this.data = data;
		this.parsedData = [];

		// Added to support UTF-8 Characters
		for (var i = 0, l = this.data.length; i < l; i++) {
			var byteArray = [];
			var code = this.data.charCodeAt(i);

			if (code > 0x10000) {
				byteArray[0] = 0xF0 | ((code & 0x1C0000) >>> 18);
				byteArray[1] = 0x80 | ((code & 0x3F000) >>> 12);
				byteArray[2] = 0x80 | ((code & 0xFC0) >>> 6);
				byteArray[3] = 0x80 | (code & 0x3F);
			} else if (code > 0x800) {
				byteArray[0] = 0xE0 | ((code & 0xF000) >>> 12);
				byteArray[1] = 0x80 | ((code & 0xFC0) >>> 6);
				byteArray[2] = 0x80 | (code & 0x3F);
			} else if (code > 0x80) {
				byteArray[0] = 0xC0 | ((code & 0x7C0) >>> 6);
				byteArray[1] = 0x80 | (code & 0x3F);
			} else {
				byteArray[0] = code;
			}

			this.parsedData.push(byteArray);
		}

		this.parsedData = Array.prototype.concat.apply([], this.parsedData);

		if (this.parsedData.length != this.data.length) {
			this.parsedData.unshift(191);
			this.parsedData.unshift(187);
			this.parsedData.unshift(239);
		}
	}

	QR8bitByte.prototype = {
		getLength: function (buffer) {
			return this.parsedData.length;
		},
		write: function (buffer) {
			for (var i = 0, l = this.parsedData.length; i < l; i++) {
				buffer.put(this.parsedData[i], 8);
			}
		}
	};

	function QRCodeModel(typeNumber, errorCorrectLevel) {
		this.typeNumber = typeNumber;
		this.errorCorrectLevel = errorCorrectLevel;
		this.modules = null;
		this.moduleCount = 0;
		this.dataCache = null;
		this.dataList = [];
	}

	QRCodeModel.prototype={addData:function(data){var newData=new QR8bitByte(data);this.dataList.push(newData);this.dataCache=null;},isDark:function(row,col){if(row<0||this.moduleCount<=row||col<0||this.moduleCount<=col){throw new Error(row+","+col);}
	return this.modules[row][col];},getModuleCount:function(){return this.moduleCount;},make:function(){this.makeImpl(false,this.getBestMaskPattern());},makeImpl:function(test,maskPattern){this.moduleCount=this.typeNumber*4+17;this.modules=new Array(this.moduleCount);for(var row=0;row<this.moduleCount;row++){this.modules[row]=new Array(this.moduleCount);for(var col=0;col<this.moduleCount;col++){this.modules[row][col]=null;}}
	this.setupPositionProbePattern(0,0);this.setupPositionProbePattern(this.moduleCount-7,0);this.setupPositionProbePattern(0,this.moduleCount-7);this.setupPositionAdjustPattern();this.setupTimingPattern();this.setupTypeInfo(test,maskPattern);if(this.typeNumber>=7){this.setupTypeNumber(test);}
	if(this.dataCache==null){this.dataCache=QRCodeModel.createData(this.typeNumber,this.errorCorrectLevel,this.dataList);}
	this.mapData(this.dataCache,maskPattern);},setupPositionProbePattern:function(row,col){for(var r=-1;r<=7;r++){if(row+r<=-1||this.moduleCount<=row+r)continue;for(var c=-1;c<=7;c++){if(col+c<=-1||this.moduleCount<=col+c)continue;if((0<=r&&r<=6&&(c==0||c==6))||(0<=c&&c<=6&&(r==0||r==6))||(2<=r&&r<=4&&2<=c&&c<=4)){this.modules[row+r][col+c]=true;}else{this.modules[row+r][col+c]=false;}}}},getBestMaskPattern:function(){var minLostPoint=0;var pattern=0;for(var i=0;i<8;i++){this.makeImpl(true,i);var lostPoint=QRUtil.getLostPoint(this);if(i==0||minLostPoint>lostPoint){minLostPoint=lostPoint;pattern=i;}}
	return pattern;},createMovieClip:function(target_mc,instance_name,depth){var qr_mc=target_mc.createEmptyMovieClip(instance_name,depth);var cs=1;this.make();for(var row=0;row<this.modules.length;row++){var y=row*cs;for(var col=0;col<this.modules[row].length;col++){var x=col*cs;var dark=this.modules[row][col];if(dark){qr_mc.beginFill(0,100);qr_mc.moveTo(x,y);qr_mc.lineTo(x+cs,y);qr_mc.lineTo(x+cs,y+cs);qr_mc.lineTo(x,y+cs);qr_mc.endFill();}}}
	return qr_mc;},setupTimingPattern:function(){for(var r=8;r<this.moduleCount-8;r++){if(this.modules[r][6]!=null){continue;}
	this.modules[r][6]=(r%2==0);}
	for(var c=8;c<this.moduleCount-8;c++){if(this.modules[6][c]!=null){continue;}
	this.modules[6][c]=(c%2==0);}},setupPositionAdjustPattern:function(){var pos=QRUtil.getPatternPosition(this.typeNumber);for(var i=0;i<pos.length;i++){for(var j=0;j<pos.length;j++){var row=pos[i];var col=pos[j];if(this.modules[row][col]!=null){continue;}
	for(var r=-2;r<=2;r++){for(var c=-2;c<=2;c++){if(r==-2||r==2||c==-2||c==2||(r==0&&c==0)){this.modules[row+r][col+c]=true;}else{this.modules[row+r][col+c]=false;}}}}}},setupTypeNumber:function(test){var bits=QRUtil.getBCHTypeNumber(this.typeNumber);for(var i=0;i<18;i++){var mod=(!test&&((bits>>i)&1)==1);this.modules[Math.floor(i/3)][i%3+this.moduleCount-8-3]=mod;}
	for(var i=0;i<18;i++){var mod=(!test&&((bits>>i)&1)==1);this.modules[i%3+this.moduleCount-8-3][Math.floor(i/3)]=mod;}},setupTypeInfo:function(test,maskPattern){var data=(this.errorCorrectLevel<<3)|maskPattern;var bits=QRUtil.getBCHTypeInfo(data);for(var i=0;i<15;i++){var mod=(!test&&((bits>>i)&1)==1);if(i<6){this.modules[i][8]=mod;}else if(i<8){this.modules[i+1][8]=mod;}else{this.modules[this.moduleCount-15+i][8]=mod;}}
	for(var i=0;i<15;i++){var mod=(!test&&((bits>>i)&1)==1);if(i<8){this.modules[8][this.moduleCount-i-1]=mod;}else if(i<9){this.modules[8][15-i-1+1]=mod;}else{this.modules[8][15-i-1]=mod;}}
	this.modules[this.moduleCount-8][8]=(!test);},mapData:function(data,maskPattern){var inc=-1;var row=this.moduleCount-1;var bitIndex=7;var byteIndex=0;for(var col=this.moduleCount-1;col>0;col-=2){if(col==6)col--;while(true){for(var c=0;c<2;c++){if(this.modules[row][col-c]==null){var dark=false;if(byteIndex<data.length){dark=(((data[byteIndex]>>>bitIndex)&1)==1);}
	var mask=QRUtil.getMask(maskPattern,row,col-c);if(mask){dark=!dark;}
	this.modules[row][col-c]=dark;bitIndex--;if(bitIndex==-1){byteIndex++;bitIndex=7;}}}
	row+=inc;if(row<0||this.moduleCount<=row){row-=inc;inc=-inc;break;}}}}};QRCodeModel.PAD0=0xEC;QRCodeModel.PAD1=0x11;QRCodeModel.createData=function(typeNumber,errorCorrectLevel,dataList){var rsBlocks=QRRSBlock.getRSBlocks(typeNumber,errorCorrectLevel);var buffer=new QRBitBuffer();for(var i=0;i<dataList.length;i++){var data=dataList[i];buffer.put(data.mode,4);buffer.put(data.getLength(),QRUtil.getLengthInBits(data.mode,typeNumber));data.write(buffer);}
	var totalDataCount=0;for(var i=0;i<rsBlocks.length;i++){totalDataCount+=rsBlocks[i].dataCount;}
	if(buffer.getLengthInBits()>totalDataCount*8){throw new Error("code length overflow. ("
	+buffer.getLengthInBits()
	+">"
	+totalDataCount*8
	+")");}
	if(buffer.getLengthInBits()+4<=totalDataCount*8){buffer.put(0,4);}
	while(buffer.getLengthInBits()%8!=0){buffer.putBit(false);}
	while(true){if(buffer.getLengthInBits()>=totalDataCount*8){break;}
	buffer.put(QRCodeModel.PAD0,8);if(buffer.getLengthInBits()>=totalDataCount*8){break;}
	buffer.put(QRCodeModel.PAD1,8);}
	return QRCodeModel.createBytes(buffer,rsBlocks);};QRCodeModel.createBytes=function(buffer,rsBlocks){var offset=0;var maxDcCount=0;var maxEcCount=0;var dcdata=new Array(rsBlocks.length);var ecdata=new Array(rsBlocks.length);for(var r=0;r<rsBlocks.length;r++){var dcCount=rsBlocks[r].dataCount;var ecCount=rsBlocks[r].totalCount-dcCount;maxDcCount=Math.max(maxDcCount,dcCount);maxEcCount=Math.max(maxEcCount,ecCount);dcdata[r]=new Array(dcCount);for(var i=0;i<dcdata[r].length;i++){dcdata[r][i]=0xff&buffer.buffer[i+offset];}
	offset+=dcCount;var rsPoly=QRUtil.getErrorCorrectPolynomial(ecCount);var rawPoly=new QRPolynomial(dcdata[r],rsPoly.getLength()-1);var modPoly=rawPoly.mod(rsPoly);ecdata[r]=new Array(rsPoly.getLength()-1);for(var i=0;i<ecdata[r].length;i++){var modIndex=i+modPoly.getLength()-ecdata[r].length;ecdata[r][i]=(modIndex>=0)?modPoly.get(modIndex):0;}}
	var totalCodeCount=0;for(var i=0;i<rsBlocks.length;i++){totalCodeCount+=rsBlocks[i].totalCount;}
	var data=new Array(totalCodeCount);var index=0;for(var i=0;i<maxDcCount;i++){for(var r=0;r<rsBlocks.length;r++){if(i<dcdata[r].length){data[index++]=dcdata[r][i];}}}
	for(var i=0;i<maxEcCount;i++){for(var r=0;r<rsBlocks.length;r++){if(i<ecdata[r].length){data[index++]=ecdata[r][i];}}}
	return data;};var QRMode={MODE_NUMBER:1<<0,MODE_ALPHA_NUM:1<<1,MODE_8BIT_BYTE:1<<2,MODE_KANJI:1<<3};var QRErrorCorrectLevel={L:1,M:0,Q:3,H:2};var QRMaskPattern={PATTERN000:0,PATTERN001:1,PATTERN010:2,PATTERN011:3,PATTERN100:4,PATTERN101:5,PATTERN110:6,PATTERN111:7};var QRUtil={PATTERN_POSITION_TABLE:[[],[6,18],[6,22],[6,26],[6,30],[6,34],[6,22,38],[6,24,42],[6,26,46],[6,28,50],[6,30,54],[6,32,58],[6,34,62],[6,26,46,66],[6,26,48,70],[6,26,50,74],[6,30,54,78],[6,30,56,82],[6,30,58,86],[6,34,62,90],[6,28,50,72,94],[6,26,50,74,98],[6,30,54,78,102],[6,28,54,80,106],[6,32,58,84,110],[6,30,58,86,114],[6,34,62,90,118],[6,26,50,74,98,122],[6,30,54,78,102,126],[6,26,52,78,104,130],[6,30,56,82,108,134],[6,34,60,86,112,138],[6,30,58,86,114,142],[6,34,62,90,118,146],[6,30,54,78,102,126,150],[6,24,50,76,102,128,154],[6,28,54,80,106,132,158],[6,32,58,84,110,136,162],[6,26,54,82,110,138,166],[6,30,58,86,114,142,170]],G15:(1<<10)|(1<<8)|(1<<5)|(1<<4)|(1<<2)|(1<<1)|(1<<0),G18:(1<<12)|(1<<11)|(1<<10)|(1<<9)|(1<<8)|(1<<5)|(1<<2)|(1<<0),G15_MASK:(1<<14)|(1<<12)|(1<<10)|(1<<4)|(1<<1),getBCHTypeInfo:function(data){var d=data<<10;while(QRUtil.getBCHDigit(d)-QRUtil.getBCHDigit(QRUtil.G15)>=0){d^=(QRUtil.G15<<(QRUtil.getBCHDigit(d)-QRUtil.getBCHDigit(QRUtil.G15)));}
	return((data<<10)|d)^QRUtil.G15_MASK;},getBCHTypeNumber:function(data){var d=data<<12;while(QRUtil.getBCHDigit(d)-QRUtil.getBCHDigit(QRUtil.G18)>=0){d^=(QRUtil.G18<<(QRUtil.getBCHDigit(d)-QRUtil.getBCHDigit(QRUtil.G18)));}
	return(data<<12)|d;},getBCHDigit:function(data){var digit=0;while(data!=0){digit++;data>>>=1;}
	return digit;},getPatternPosition:function(typeNumber){return QRUtil.PATTERN_POSITION_TABLE[typeNumber-1];},getMask:function(maskPattern,i,j){switch(maskPattern){case QRMaskPattern.PATTERN000:return(i+j)%2==0;case QRMaskPattern.PATTERN001:return i%2==0;case QRMaskPattern.PATTERN010:return j%3==0;case QRMaskPattern.PATTERN011:return(i+j)%3==0;case QRMaskPattern.PATTERN100:return(Math.floor(i/2)+Math.floor(j/3))%2==0;case QRMaskPattern.PATTERN101:return(i*j)%2+(i*j)%3==0;case QRMaskPattern.PATTERN110:return((i*j)%2+(i*j)%3)%2==0;case QRMaskPattern.PATTERN111:return((i*j)%3+(i+j)%2)%2==0;default:throw new Error("bad maskPattern:"+maskPattern);}},getErrorCorrectPolynomial:function(errorCorrectLength){var a=new QRPolynomial([1],0);for(var i=0;i<errorCorrectLength;i++){a=a.multiply(new QRPolynomial([1,QRMath.gexp(i)],0));}
	return a;},getLengthInBits:function(mode,type){if(1<=type&&type<10){switch(mode){case QRMode.MODE_NUMBER:return 10;case QRMode.MODE_ALPHA_NUM:return 9;case QRMode.MODE_8BIT_BYTE:return 8;case QRMode.MODE_KANJI:return 8;default:throw new Error("mode:"+mode);}}else if(type<27){switch(mode){case QRMode.MODE_NUMBER:return 12;case QRMode.MODE_ALPHA_NUM:return 11;case QRMode.MODE_8BIT_BYTE:return 16;case QRMode.MODE_KANJI:return 10;default:throw new Error("mode:"+mode);}}else if(type<41){switch(mode){case QRMode.MODE_NUMBER:return 14;case QRMode.MODE_ALPHA_NUM:return 13;case QRMode.MODE_8BIT_BYTE:return 16;case QRMode.MODE_KANJI:return 12;default:throw new Error("mode:"+mode);}}else{throw new Error("type:"+type);}},getLostPoint:function(qrCode){var moduleCount=qrCode.getModuleCount();var lostPoint=0;for(var row=0;row<moduleCount;row++){for(var col=0;col<moduleCount;col++){var sameCount=0;var dark=qrCode.isDark(row,col);for(var r=-1;r<=1;r++){if(row+r<0||moduleCount<=row+r){continue;}
	for(var c=-1;c<=1;c++){if(col+c<0||moduleCount<=col+c){continue;}
	if(r==0&&c==0){continue;}
	if(dark==qrCode.isDark(row+r,col+c)){sameCount++;}}}
	if(sameCount>5){lostPoint+=(3+sameCount-5);}}}
	for(var row=0;row<moduleCount-1;row++){for(var col=0;col<moduleCount-1;col++){var count=0;if(qrCode.isDark(row,col))count++;if(qrCode.isDark(row+1,col))count++;if(qrCode.isDark(row,col+1))count++;if(qrCode.isDark(row+1,col+1))count++;if(count==0||count==4){lostPoint+=3;}}}
	for(var row=0;row<moduleCount;row++){for(var col=0;col<moduleCount-6;col++){if(qrCode.isDark(row,col)&&!qrCode.isDark(row,col+1)&&qrCode.isDark(row,col+2)&&qrCode.isDark(row,col+3)&&qrCode.isDark(row,col+4)&&!qrCode.isDark(row,col+5)&&qrCode.isDark(row,col+6)){lostPoint+=40;}}}
	for(var col=0;col<moduleCount;col++){for(var row=0;row<moduleCount-6;row++){if(qrCode.isDark(row,col)&&!qrCode.isDark(row+1,col)&&qrCode.isDark(row+2,col)&&qrCode.isDark(row+3,col)&&qrCode.isDark(row+4,col)&&!qrCode.isDark(row+5,col)&&qrCode.isDark(row+6,col)){lostPoint+=40;}}}
	var darkCount=0;for(var col=0;col<moduleCount;col++){for(var row=0;row<moduleCount;row++){if(qrCode.isDark(row,col)){darkCount++;}}}
	var ratio=Math.abs(100*darkCount/moduleCount/moduleCount-50)/5;lostPoint+=ratio*10;return lostPoint;}};var QRMath={glog:function(n){if(n<1){throw new Error("glog("+n+")");}
	return QRMath.LOG_TABLE[n];},gexp:function(n){while(n<0){n+=255;}
	while(n>=256){n-=255;}
	return QRMath.EXP_TABLE[n];},EXP_TABLE:new Array(256),LOG_TABLE:new Array(256)};for(var i=0;i<8;i++){QRMath.EXP_TABLE[i]=1<<i;}
	for(var i=8;i<256;i++){QRMath.EXP_TABLE[i]=QRMath.EXP_TABLE[i-4]^QRMath.EXP_TABLE[i-5]^QRMath.EXP_TABLE[i-6]^QRMath.EXP_TABLE[i-8];}
	for(var i=0;i<255;i++){QRMath.LOG_TABLE[QRMath.EXP_TABLE[i]]=i;}
	function QRPolynomial(num,shift){if(num.length==undefined){throw new Error(num.length+"/"+shift);}
	var offset=0;while(offset<num.length&&num[offset]==0){offset++;}
	this.num=new Array(num.length-offset+shift);for(var i=0;i<num.length-offset;i++){this.num[i]=num[i+offset];}}
	QRPolynomial.prototype={get:function(index){return this.num[index];},getLength:function(){return this.num.length;},multiply:function(e){var num=new Array(this.getLength()+e.getLength()-1);for(var i=0;i<this.getLength();i++){for(var j=0;j<e.getLength();j++){num[i+j]^=QRMath.gexp(QRMath.glog(this.get(i))+QRMath.glog(e.get(j)));}}
	return new QRPolynomial(num,0);},mod:function(e){if(this.getLength()-e.getLength()<0){return this;}
	var ratio=QRMath.glog(this.get(0))-QRMath.glog(e.get(0));var num=new Array(this.getLength());for(var i=0;i<this.getLength();i++){num[i]=this.get(i);}
	for(var i=0;i<e.getLength();i++){num[i]^=QRMath.gexp(QRMath.glog(e.get(i))+ratio);}
	return new QRPolynomial(num,0).mod(e);}};function QRRSBlock(totalCount,dataCount){this.totalCount=totalCount;this.dataCount=dataCount;}
	QRRSBlock.RS_BLOCK_TABLE=[[1,26,19],[1,26,16],[1,26,13],[1,26,9],[1,44,34],[1,44,28],[1,44,22],[1,44,16],[1,70,55],[1,70,44],[2,35,17],[2,35,13],[1,100,80],[2,50,32],[2,50,24],[4,25,9],[1,134,108],[2,67,43],[2,33,15,2,34,16],[2,33,11,2,34,12],[2,86,68],[4,43,27],[4,43,19],[4,43,15],[2,98,78],[4,49,31],[2,32,14,4,33,15],[4,39,13,1,40,14],[2,121,97],[2,60,38,2,61,39],[4,40,18,2,41,19],[4,40,14,2,41,15],[2,146,116],[3,58,36,2,59,37],[4,36,16,4,37,17],[4,36,12,4,37,13],[2,86,68,2,87,69],[4,69,43,1,70,44],[6,43,19,2,44,20],[6,43,15,2,44,16],[4,101,81],[1,80,50,4,81,51],[4,50,22,4,51,23],[3,36,12,8,37,13],[2,116,92,2,117,93],[6,58,36,2,59,37],[4,46,20,6,47,21],[7,42,14,4,43,15],[4,133,107],[8,59,37,1,60,38],[8,44,20,4,45,21],[12,33,11,4,34,12],[3,145,115,1,146,116],[4,64,40,5,65,41],[11,36,16,5,37,17],[11,36,12,5,37,13],[5,109,87,1,110,88],[5,65,41,5,66,42],[5,54,24,7,55,25],[11,36,12],[5,122,98,1,123,99],[7,73,45,3,74,46],[15,43,19,2,44,20],[3,45,15,13,46,16],[1,135,107,5,136,108],[10,74,46,1,75,47],[1,50,22,15,51,23],[2,42,14,17,43,15],[5,150,120,1,151,121],[9,69,43,4,70,44],[17,50,22,1,51,23],[2,42,14,19,43,15],[3,141,113,4,142,114],[3,70,44,11,71,45],[17,47,21,4,48,22],[9,39,13,16,40,14],[3,135,107,5,136,108],[3,67,41,13,68,42],[15,54,24,5,55,25],[15,43,15,10,44,16],[4,144,116,4,145,117],[17,68,42],[17,50,22,6,51,23],[19,46,16,6,47,17],[2,139,111,7,140,112],[17,74,46],[7,54,24,16,55,25],[34,37,13],[4,151,121,5,152,122],[4,75,47,14,76,48],[11,54,24,14,55,25],[16,45,15,14,46,16],[6,147,117,4,148,118],[6,73,45,14,74,46],[11,54,24,16,55,25],[30,46,16,2,47,17],[8,132,106,4,133,107],[8,75,47,13,76,48],[7,54,24,22,55,25],[22,45,15,13,46,16],[10,142,114,2,143,115],[19,74,46,4,75,47],[28,50,22,6,51,23],[33,46,16,4,47,17],[8,152,122,4,153,123],[22,73,45,3,74,46],[8,53,23,26,54,24],[12,45,15,28,46,16],[3,147,117,10,148,118],[3,73,45,23,74,46],[4,54,24,31,55,25],[11,45,15,31,46,16],[7,146,116,7,147,117],[21,73,45,7,74,46],[1,53,23,37,54,24],[19,45,15,26,46,16],[5,145,115,10,146,116],[19,75,47,10,76,48],[15,54,24,25,55,25],[23,45,15,25,46,16],[13,145,115,3,146,116],[2,74,46,29,75,47],[42,54,24,1,55,25],[23,45,15,28,46,16],[17,145,115],[10,74,46,23,75,47],[10,54,24,35,55,25],[19,45,15,35,46,16],[17,145,115,1,146,116],[14,74,46,21,75,47],[29,54,24,19,55,25],[11,45,15,46,46,16],[13,145,115,6,146,116],[14,74,46,23,75,47],[44,54,24,7,55,25],[59,46,16,1,47,17],[12,151,121,7,152,122],[12,75,47,26,76,48],[39,54,24,14,55,25],[22,45,15,41,46,16],[6,151,121,14,152,122],[6,75,47,34,76,48],[46,54,24,10,55,25],[2,45,15,64,46,16],[17,152,122,4,153,123],[29,74,46,14,75,47],[49,54,24,10,55,25],[24,45,15,46,46,16],[4,152,122,18,153,123],[13,74,46,32,75,47],[48,54,24,14,55,25],[42,45,15,32,46,16],[20,147,117,4,148,118],[40,75,47,7,76,48],[43,54,24,22,55,25],[10,45,15,67,46,16],[19,148,118,6,149,119],[18,75,47,31,76,48],[34,54,24,34,55,25],[20,45,15,61,46,16]];QRRSBlock.getRSBlocks=function(typeNumber,errorCorrectLevel){var rsBlock=QRRSBlock.getRsBlockTable(typeNumber,errorCorrectLevel);if(rsBlock==undefined){throw new Error("bad rs block @ typeNumber:"+typeNumber+"/errorCorrectLevel:"+errorCorrectLevel);}
	var length=rsBlock.length/3;var list=[];for(var i=0;i<length;i++){var count=rsBlock[i*3+0];var totalCount=rsBlock[i*3+1];var dataCount=rsBlock[i*3+2];for(var j=0;j<count;j++){list.push(new QRRSBlock(totalCount,dataCount));}}
	return list;};QRRSBlock.getRsBlockTable=function(typeNumber,errorCorrectLevel){switch(errorCorrectLevel){case QRErrorCorrectLevel.L:return QRRSBlock.RS_BLOCK_TABLE[(typeNumber-1)*4+0];case QRErrorCorrectLevel.M:return QRRSBlock.RS_BLOCK_TABLE[(typeNumber-1)*4+1];case QRErrorCorrectLevel.Q:return QRRSBlock.RS_BLOCK_TABLE[(typeNumber-1)*4+2];case QRErrorCorrectLevel.H:return QRRSBlock.RS_BLOCK_TABLE[(typeNumber-1)*4+3];default:return undefined;}};function QRBitBuffer(){this.buffer=[];this.length=0;}
	QRBitBuffer.prototype={get:function(index){var bufIndex=Math.floor(index/8);return((this.buffer[bufIndex]>>>(7-index%8))&1)==1;},put:function(num,length){for(var i=0;i<length;i++){this.putBit(((num>>>(length-i-1))&1)==1);}},getLengthInBits:function(){return this.length;},putBit:function(bit){var bufIndex=Math.floor(this.length/8);if(this.buffer.length<=bufIndex){this.buffer.push(0);}
	if(bit){this.buffer[bufIndex]|=(0x80>>>(this.length%8));}
	this.length++;}};var QRCodeLimitLength=[[17,14,11,7],[32,26,20,14],[53,42,32,24],[78,62,46,34],[106,84,60,44],[134,106,74,58],[154,122,86,64],[192,152,108,84],[230,180,130,98],[271,213,151,119],[321,251,177,137],[367,287,203,155],[425,331,241,177],[458,362,258,194],[520,412,292,220],[586,450,322,250],[644,504,364,280],[718,560,394,310],[792,624,442,338],[858,666,482,382],[929,711,509,403],[1003,779,565,439],[1091,857,611,461],[1171,911,661,511],[1273,997,715,535],[1367,1059,751,593],[1465,1125,805,625],[1528,1190,868,658],[1628,1264,908,698],[1732,1370,982,742],[1840,1452,1030,790],[1952,1538,1112,842],[2068,1628,1168,898],[2188,1722,1228,958],[2303,1809,1283,983],[2431,1911,1351,1051],[2563,1989,1423,1093],[2699,2099,1499,1139],[2809,2213,1579,1219],[2953,2331,1663,1273]];
	
	function _isSupportCanvas() {
		return typeof CanvasRenderingContext2D != "undefined";
	}
	
	// android 2.x doesn't support Data-URI spec
	function _getAndroid() {
		var android = false;
		var sAgent = navigator.userAgent;
		
		if (/android/i.test(sAgent)) { // android
			android = true;
			var aMat = sAgent.toString().match(/android ([0-9]\.[0-9])/i);
			
			if (aMat && aMat[1]) {
				android = parseFloat(aMat[1]);
			}
		}
		
		return android;
	}
	
	var svgDrawer = (function() {

		var Drawing = function (el, htOption) {
			this._el = el;
			this._htOption = htOption;
		};

		Drawing.prototype.draw = function (oQRCode) {
			var _htOption = this._htOption;
			var _el = this._el;
			var nCount = oQRCode.getModuleCount();
			var nWidth = Math.floor(_htOption.width / nCount);
			var nHeight = Math.floor(_htOption.height / nCount);

			this.clear();

			function makeSVG(tag, attrs) {
				var el = document.createElementNS('http://www.w3.org/2000/svg', tag);
				for (var k in attrs)
					if (attrs.hasOwnProperty(k)) el.setAttribute(k, attrs[k]);
				return el;
			}

			var svg = makeSVG("svg" , {'viewBox': '0 0 ' + String(nCount) + " " + String(nCount), 'width': '100%', 'height': '100%', 'fill': _htOption.colorLight});
			svg.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
			_el.appendChild(svg);

			svg.appendChild(makeSVG("rect", {"fill": _htOption.colorLight, "width": "100%", "height": "100%"}));
			svg.appendChild(makeSVG("rect", {"fill": _htOption.colorDark, "width": "1", "height": "1", "id": "template"}));

			for (var row = 0; row < nCount; row++) {
				for (var col = 0; col < nCount; col++) {
					if (oQRCode.isDark(row, col)) {
						var child = makeSVG("use", {"x": String(row), "y": String(col)});
						child.setAttributeNS("http://www.w3.org/1999/xlink", "href", "#template")
						svg.appendChild(child);
					}
				}
			}
		};
		Drawing.prototype.clear = function () {
			while (this._el.hasChildNodes())
				this._el.removeChild(this._el.lastChild);
		};
		return Drawing;
	})();

	var useSVG = document.documentElement.tagName.toLowerCase() === "svg";

	// Drawing in DOM by using Table tag
	var Drawing = useSVG ? svgDrawer : !_isSupportCanvas() ? (function () {
		var Drawing = function (el, htOption) {
			this._el = el;
			this._htOption = htOption;
		};
			
		/**
		 * Draw the QRCode
		 * 
		 * @param {QRCode} oQRCode
		 */
		Drawing.prototype.draw = function (oQRCode) {
            var _htOption = this._htOption;
            var _el = this._el;
			var nCount = oQRCode.getModuleCount();
			var nWidth = Math.floor(_htOption.width / nCount);
			var nHeight = Math.floor(_htOption.height / nCount);
			var aHTML = ['<table style="border:0;border-collapse:collapse;">'];
			
			for (var row = 0; row < nCount; row++) {
				aHTML.push('<tr>');
				
				for (var col = 0; col < nCount; col++) {
					aHTML.push('<td style="border:0;border-collapse:collapse;padding:0;margin:0;width:' + nWidth + 'px;height:' + nHeight + 'px;background-color:' + (oQRCode.isDark(row, col) ? _htOption.colorDark : _htOption.colorLight) + ';"></td>');
				}
				
				aHTML.push('</tr>');
			}
			
			aHTML.push('</table>');
			_el.innerHTML = aHTML.join('');
			
			// Fix the margin values as real size.
			var elTable = _el.childNodes[0];
			var nLeftMarginTable = (_htOption.width - elTable.offsetWidth) / 2;
			var nTopMarginTable = (_htOption.height - elTable.offsetHeight) / 2;
			
			if (nLeftMarginTable > 0 && nTopMarginTable > 0) {
				elTable.style.margin = nTopMarginTable + "px " + nLeftMarginTable + "px";	
			}
		};
		
		/**
		 * Clear the QRCode
		 */
		Drawing.prototype.clear = function () {
			this._el.innerHTML = '';
		};
		
		return Drawing;
	})() : (function () { // Drawing in Canvas
		function _onMakeImage() {
			this._elImage.src = this._elCanvas.toDataURL("image/png");
			this._elImage.style.display = "block";
			this._elCanvas.style.display = "none";			
		}
		
		// Android 2.1 bug workaround
		// http://code.google.com/p/android/issues/detail?id=5141
		if (this != undefined && this._android && this._android <= 2.1) {
	    	var factor = 1 / window.devicePixelRatio;
	        var drawImage = CanvasRenderingContext2D.prototype.drawImage; 
	    	CanvasRenderingContext2D.prototype.drawImage = function (image, sx, sy, sw, sh, dx, dy, dw, dh) {
	    		if (("nodeName" in image) && /img/i.test(image.nodeName)) {
		        	for (var i = arguments.length - 1; i >= 1; i--) {
		            	arguments[i] = arguments[i] * factor;
		        	}
	    		} else if (typeof dw == "undefined") {
	    			arguments[1] *= factor;
	    			arguments[2] *= factor;
	    			arguments[3] *= factor;
	    			arguments[4] *= factor;
	    		}
	    		
	        	drawImage.apply(this, arguments); 
	    	};
		}
		
		/**
		 * Check whether the user's browser supports Data URI or not
		 * 
		 * @private
		 * @param {Function} fSuccess Occurs if it supports Data URI
		 * @param {Function} fFail Occurs if it doesn't support Data URI
		 */
		function _safeSetDataURI(fSuccess, fFail) {
            var self = this;
            self._fFail = fFail;
            self._fSuccess = fSuccess;

            // Check it just once
            if (self._bSupportDataURI === null) {
                var el = document.createElement("img");
                var fOnError = function() {
                    self._bSupportDataURI = false;

                    if (self._fFail) {
                        self._fFail.call(self);
                    }
                };
                var fOnSuccess = function() {
                    self._bSupportDataURI = true;

                    if (self._fSuccess) {
                        self._fSuccess.call(self);
                    }
                };

                el.onabort = fOnError;
                el.onerror = fOnError;
                el.onload = fOnSuccess;
                el.src = "data:image/gif;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg=="; // the Image contains 1px data.
                return;
            } else if (self._bSupportDataURI === true && self._fSuccess) {
                self._fSuccess.call(self);
            } else if (self._bSupportDataURI === false && self._fFail) {
                self._fFail.call(self);
            }
		};
		
		/**
		 * Drawing QRCode by using canvas
		 * 
		 * @constructor
		 * @param {HTMLElement} el
		 * @param {Object} htOption QRCode Options 
		 */
		var Drawing = function (el, htOption) {
    		this._bIsPainted = false;
    		this._android = _getAndroid();
		
			this._htOption = htOption;
			this._elCanvas = document.createElement("canvas");
			this._elCanvas.width = htOption.width;
			this._elCanvas.height = htOption.height;
			el.appendChild(this._elCanvas);
			this._el = el;
			this._oContext = this._elCanvas.getContext("2d");
			this._bIsPainted = false;
			this._elImage = document.createElement("img");
			this._elImage.alt = "Scan me!";
			this._elImage.style.display = "none";
			this._el.appendChild(this._elImage);
			this._bSupportDataURI = null;
		};
			
		/**
		 * Draw the QRCode
		 * 
		 * @param {QRCode} oQRCode 
		 */
		Drawing.prototype.draw = function (oQRCode) {
            var _elImage = this._elImage;
            var _oContext = this._oContext;
            var _htOption = this._htOption;
            
			var nCount = oQRCode.getModuleCount();
			var nWidth = _htOption.width / nCount;
			var nHeight = _htOption.height / nCount;
			var nRoundedWidth = Math.round(nWidth);
			var nRoundedHeight = Math.round(nHeight);

			_elImage.style.display = "none";
			this.clear();
			
			for (var row = 0; row < nCount; row++) {
				for (var col = 0; col < nCount; col++) {
					var bIsDark = oQRCode.isDark(row, col);
					var nLeft = col * nWidth;
					var nTop = row * nHeight;
					_oContext.strokeStyle = bIsDark ? _htOption.colorDark : _htOption.colorLight;
					_oContext.lineWidth = 1;
					_oContext.fillStyle = bIsDark ? _htOption.colorDark : _htOption.colorLight;					
					_oContext.fillRect(nLeft, nTop, nWidth, nHeight);
					
					// 안티 앨리어싱 방지 처리
					_oContext.strokeRect(
						Math.floor(nLeft) + 0.5,
						Math.floor(nTop) + 0.5,
						nRoundedWidth,
						nRoundedHeight
					);
					
					_oContext.strokeRect(
						Math.ceil(nLeft) - 0.5,
						Math.ceil(nTop) - 0.5,
						nRoundedWidth,
						nRoundedHeight
					);
				}
			}
			
			this._bIsPainted = true;
		};
			
		/**
		 * Make the image from Canvas if the browser supports Data URI.
		 */
		Drawing.prototype.makeImage = function () {
			if (this._bIsPainted) {
				_safeSetDataURI.call(this, _onMakeImage);
			}
		};
			
		/**
		 * Return whether the QRCode is painted or not
		 * 
		 * @return {Boolean}
		 */
		Drawing.prototype.isPainted = function () {
			return this._bIsPainted;
		};
		
		/**
		 * Clear the QRCode
		 */
		Drawing.prototype.clear = function () {
			this._oContext.clearRect(0, 0, this._elCanvas.width, this._elCanvas.height);
			this._bIsPainted = false;
		};
		
		/**
		 * @private
		 * @param {Number} nNumber
		 */
		Drawing.prototype.round = function (nNumber) {
			if (!nNumber) {
				return nNumber;
			}
			
			return Math.floor(nNumber * 1000) / 1000;
		};
		
		return Drawing;
	})();
	
	/**
	 * Get the type by string length
	 * 
	 * @private
	 * @param {String} sText
	 * @param {Number} nCorrectLevel
	 * @return {Number} type
	 */
	function _getTypeNumber(sText, nCorrectLevel) {			
		var nType = 1;
		var length = _getUTF8Length(sText);
		
		for (var i = 0, len = QRCodeLimitLength.length; i <= len; i++) {
			var nLimit = 0;
			
			switch (nCorrectLevel) {
				case QRErrorCorrectLevel.L :
					nLimit = QRCodeLimitLength[i][0];
					break;
				case QRErrorCorrectLevel.M :
					nLimit = QRCodeLimitLength[i][1];
					break;
				case QRErrorCorrectLevel.Q :
					nLimit = QRCodeLimitLength[i][2];
					break;
				case QRErrorCorrectLevel.H :
					nLimit = QRCodeLimitLength[i][3];
					break;
			}
			
			if (length <= nLimit) {
				break;
			} else {
				nType++;
			}
		}
		
		if (nType > QRCodeLimitLength.length) {
			throw new Error("Too long data");
		}
		
		return nType;
	}

	function _getUTF8Length(sText) {
		var replacedText = encodeURI(sText).toString().replace(/\%[0-9a-fA-F]{2}/g, 'a');
		return replacedText.length + (replacedText.length != sText ? 3 : 0);
	}
	
	/**
	 * @class QRCode
	 * @constructor
	 * @example 
	 * new QRCode(document.getElementById("test"), "http://jindo.dev.naver.com/collie");
	 *
	 * @example
	 * var oQRCode = new QRCode("test", {
	 *    text : "http://naver.com",
	 *    width : 128,
	 *    height : 128
	 * });
	 * 
	 * oQRCode.clear(); // Clear the QRCode.
	 * oQRCode.makeCode("http://map.naver.com"); // Re-create the QRCode.
	 *
	 * @param {HTMLElement|String} el target element or 'id' attribute of element.
	 * @param {Object|String} vOption
	 * @param {String} vOption.text QRCode link data
	 * @param {Number} [vOption.width=256]
	 * @param {Number} [vOption.height=256]
	 * @param {String} [vOption.colorDark="#000000"]
	 * @param {String} [vOption.colorLight="#ffffff"]
	 * @param {QRCode.CorrectLevel} [vOption.correctLevel=QRCode.CorrectLevel.H] [L|M|Q|H] 
	 */
	QRCode = function (el, vOption) {
		this._htOption = {
			width : 256, 
			height : 256,
			typeNumber : 4,
			colorDark : "#000000",
			colorLight : "#ffffff",
			correctLevel : QRErrorCorrectLevel.H
		};
		
		if (typeof vOption === 'string') {
			vOption	= {
				text : vOption
			};
		}
		
		// Overwrites options
		if (vOption) {
			for (var i in vOption) {
				this._htOption[i] = vOption[i];
			}
		}
		
		if (typeof el == "string") {
			el = document.getElementById(el);
		}

		if (this._htOption.useSVG) {
			Drawing = svgDrawer;
		}
		
		this._android = _getAndroid();
		this._el = el;
		this._oQRCode = null;
		this._oDrawing = new Drawing(this._el, this._htOption);
		
		if (this._htOption.text) {
			this.makeCode(this._htOption.text);	
		}
	};
	
	/**
	 * Make the QRCode
	 * 
	 * @param {String} sText link data
	 */
	QRCode.prototype.makeCode = function (sText) {
		this._oQRCode = new QRCodeModel(_getTypeNumber(sText, this._htOption.correctLevel), this._htOption.correctLevel);
		this._oQRCode.addData(sText);
		this._oQRCode.make();
		this._el.title = sText;
		this._oDrawing.draw(this._oQRCode);			
		this.makeImage();
	};
	
	/**
	 * Make the Image from Canvas element
	 * - It occurs automatically
	 * - Android below 3 doesn't support Data-URI spec.
	 * 
	 * @private
	 */
	QRCode.prototype.makeImage = function () {
		if (typeof this._oDrawing.makeImage == "function" && (!this._android || this._android >= 3)) {
			this._oDrawing.makeImage();
		}
	};
	
	/**
	 * Clear the QRCode
	 */
	QRCode.prototype.clear = function () {
		this._oDrawing.clear();
	};
	
	/**
	 * @name QRCode.CorrectLevel
	 */
	QRCode.CorrectLevel = QRErrorCorrectLevel;
})();


/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__(0);
/******/ 	
/******/ 	return __webpack_exports__;
/******/ })()
;
});