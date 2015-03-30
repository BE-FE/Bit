(function(global, factory) {
    /* CommonJS */
    if ( typeof require === 'function' && typeof module === 'object' && module && typeof exports === 'object' && exports)
        module['exports'] = factory(global);
    /* AMD */
    else if ( typeof define === 'function' && define['amd'])
        define(function() {
            return factory(global);
        });
    /* Global */
    else
        global['Bit'] = global['Bit'] || factory(global);
})( window ? window : this, function(global) {

    var isArray = function(o) {
        return Object.prototype.toString.call(o) === '[object Array]';
    };

    var getPointer = function(BYTE, BIT) {
        return BYTE * 8 + BIT % 8;
    };

    var Bit = function(length, isLittleEndian) {

        this.isLittleEndian = !!isLittleEndian || false;
        this.length = length || 0;
        this.originalLength = 0;

        this.bitArray = new Array(this.length / 8);
        for (var i = 0, len = this.bitArray.length; i < len; i++) {
            this.bitArray[i] = 0;
        }
        this.currentByte = 0;
        this.currentBit = 0;
    };

    Bit.version = '0.1.0';

    /**
     * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     * NEW replacement
     * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     */

    var BitPrototype = Bit.prototype;

    /**
     * is BitString
     *
     * @param {*} value
     */
    BitPrototype.isBitString = function(value) {
        return typeof value === 'string' && !/[^01]/.test(value);
    };

    /**
     * is Bit instance
     */
    BitPrototype.isBit = function(s) {
        return Object.prototype.toString.call(s) === '[object Object]' && 'bitArray' in s && s instanceof Bit;
    };

    /**
     * Write multiple type data
     *
     * @param {*} value
     * @param {Object} length
     */
    BitPrototype.write = function(value, length) {
        console.log(this.bitArray);
        if (this.isBit(value)) {
            return this.writeBit.apply(this, arguments);
        } else if (this.isBitString(value)) {
            return this.writeBitString.apply(this, arguments);
        }
        return this;
    };

    /**
     * !!Do not use
     *
     * Write a string
     * !This string is a normal string, NOT the BitString
     *
     * @param {String} str
     * @param {Number} length
     */
    BitPrototype.writeString = function(str, length) {
        if (/^[\x00-\xff]+$/.test(str)) {
            return this.writeUTF8String.apply(this, arguments);
        } else {
            return this.writeUTF16String.apply(this, arguments);
        }
    };

    /**
     * !!Do not use
     *
     * Write a UTF8String
     *
     * @param {String} str
     * @param {Number} length
     */
    BitPrototype.writeUTF8String = function(str, length) {
        for (var i = 0, len = str.length; i < len; i++) {
            this.writeBitString(str.charAt(i).charCodeAt().toString(2), 8);
        }
        return this;
    };

    /**
     * !!Do not use
     *
     * Write a UTF16String
     *
     * @param {String} str
     * @param {Number} length
     */
    BitPrototype.writeUTF16String = function(str, length) {
        for (var i = 0, len = str.length; i < len; i++) {
            this.writeBitString.apply(str.charAt(i).charCodeAt().toString(2), 16);
        }
        return this;
    };

    /**
     * Winte integer
     *
     * @param {Number} integer
     *
     * limit:
     * 	0 ~ 0x20000000000000 16
     *  0 ~ 9007199254740992 10
     * 	0 ~ 100000000000000000000000000000000000000000000000000000 2
     *  max 54 Bit
     *
     * Other "numbers" type must use a specific method
     */
    BitPrototype.writeInt = function(integer, length) {
        arguments[0] = integer.toString(2);
        return this.writeBitString.apply(this, arguments);
    };

    /**
     * Write HEX string
     *
     * @param {String} HEX
     *
     * 'A065E34D...'
     * OR
     * 'A0 65 E3 4D ...'
     */
    BitPrototype.writeHex = function(HEX) {
        var _S = [];
        HEX = HEX.replace(/\x20+/, '');
        for (var i = 0, len = HEX.length; i < len; i += 2) {
            _S.push(intToBits(parseInt(HEX.charAt(i) + HEX.charAt(i + 1), 16)));
        }
        arguments[0] = _S.join('');
        return this.writeBitString.apply(this, arguments);
    };

    /**
     * Write BitString (based method)
     *
     * @param {Object} value must be a string composed of '0' and '1'
     * @param {Object} length
     *
     * eg:
     *  value = '011000100010101';
     *  length = 5
     *
     *  011000100010101
     *            ^
     *  ==> '10101'
     */
    BitPrototype.writeBit = function(_S, _L) {

        if (_S == null)
            return this;

        if (!this.isBit(_S) && !this.isBitString(_S)) {
            throw new TypeError('Argument 0 Must be an BitInstance OR BitString');
            return this;
        }

        if (this.isBit(_S))
            _S = _S.toBitString();

        if (_L == null)
            _L = _S.length;

        if (_L === 0)
            return this;

        // Is the same as the positive and negative
        _L = Math.abs(_L);

        if (_S.length > _L) {
            _S = _S.slice(-_L);
        }

        var _V;
        var _SL = _S.length;
        var cLen = 0;
        var cBit = this.currentBit;
        var cByte = this.currentByte;

        var vStart, vEnd;
        while (cLen < _SL) {

            if (_SL - cLen < 8) {
                // Remaining
                vStart = 0;
                vEnd = _SL - cLen;
            } else {
                // when > 8 bits
                vStart = _SL - 8 * (cLen + 1) + cBit;
                vEnd = 8 - cBit;
            }
            typeof this.bitArray[cByte] === 'undefined' && (this.bitArray[cByte] = 0);
            _V = _S.substr(vStart, vEnd);
            this.bitArray[cByte] = this.bitArray[cByte] + (parseInt(_V, 2) << cBit);

            cBit + _V.length > 7 && cByte++;
            cBit = (cBit + _V.length) % 8;

            cLen += _V.length;
        }

        var cEnd = this.getCurrentPointer() + _SL;

        if (this.originalLength < cEnd) {
            this.originalLength = cEnd;
            this.byteLength = this.bitArray.length;
            this.length = this.byteLength * 8;
        }

        this.setCurrentPointer(cEnd);

        return this;
    };

    BitPrototype.writeBitTo = function(_S) {
        switch(arguments.length) {
        case 1:
            this.writeBit.apply(this, arguments);
            break;
        case 2:
            var sign = arguments[1];
            if (isArray(sign)) {
                sign = getPointer.apply(null, sign);
            }
            this.setCurrentPointer(sign);
            this.writeBit.call(this, _S);
            this.setCurrentPointer(this.originalLength);
            break;
        case 3:
            var sign = arguments[1];
            var length = arguments[2];
            if (isArray(sign)) {
                sign = getPointer.apply(null, sign);
            }
            this.setCurrentPointer(sign);
            this.writeBit.call(this, _S, length);
            this.setCurrentPointer(this.originalLength);
            break;
        }
        return this;
    };

    BitPrototype.writeBitIn = function(_S) {
        switch(arguments.length) {
        case 1:
            this.writeBit.apply(this, arguments);
            break;
        case 2:
            this.writeBitTo.apply(this, arguments);
            break;
        case 3:
            var start = arguments[1];
            var end = arguments[2];
            if (isArray(start)) {
                start = getPointer.apply(null, start);
            }
            if (isArray(end)) {
                end = getPointer.apply(null, end);
            }
            if (end > start) {
                this.setCurrentPointer(start);
                this.writeBit.call(this, _S, end - start);
                this.setCurrentPointer(this.originalLength);
            }
            break;
        }
        return this;
    };
    
    BitPrototype.getCurrentPointer = function() {
        return this.currentByte * 8 + this.currentBit;
    };

    /**
     * Set current block(byte) pointer offset
     *
     * @param {Number} num
     */
    BitPrototype.setCurrentByte = function(num) {
        this.currentByte = num;
        return this;
    };

    /**
     * Set current bit pointer offset in byte
     *
     * @param {Number} num RANGE:0~7
     */
    BitPrototype.setCurrentBit = function(num) {
        this.currentBit = num;
        return this;
    };

    /**
     * Set current pointer of global offset
     *
     * @param {Number} num
     */
    BitPrototype.setCurrentPointer = function(o) {
        if (isArray(o)) {
            this.currentByte = o[0];
            this.currentBit = o[1];
        } else {
            this.currentBit = o % 8;
            this.currentByte = (o - this.currentBit) / 8;
        }
        return this;
    };
    
    /**
     * Move pointer to begin 
     */
    BitPrototype.moveToBegin = function(){
        return this.setCurrentPointer(0);
    };
    
    /**
     * Move pointer to end 
     */
    BitPrototype.moveToEnd = function(){
        return this.setCurrentPointer(this.originalLength);
    };

    /**
     * Move to next block(byte)
     *
     * currentByte + 1
     * currentByte = 0
     */
    BitPrototype.nextByte = function() {
        this.setCurrentByte(this.currentByte + 1);
        this.setCurrentBit(0);
        return this;
    };

    BitPrototype.getInt8 = function(from) {

    };

    BitPrototype.getUint8 = function(from) {
        if (this.bitArray.length < 1) {
            throw new RangeError('Unable to meet Uint8, at least 8 bits');
        }
        from = from || 0;
        return new Uint8Array(this.bitArray.slice(0, 1));
    };
    
    BitPrototype.getInt16 = function(from) {

    };
    
    BitPrototype.getUint16 = function(from) {

    };
    
    BitPrototype.getInt32 = function(from) {

    };
    
    BitPrototype.getUint32 = function(from) {
        if (this.bitArray.length < 4) {
            throw new RangeError('Unable to meet Uint32, at least 32 bits');
        }
        from = from || 0;
        var _arr = this.bitArray.slice(0, 4);
        this.isLittleEndian && _arr.reverse();
        return new Uint32Array();
    };

    BitPrototype.toBitString = function() {
        var _arr = [].concat(this.bitArray);
        for (var i = 0, len = _arr.length; i < len; i++) {
            _arr[i] = (i == len - 1) ? _arr[i].toString(2) : intToBits(_arr[i]);
        }
        return _arr.join('');
    };

    BitPrototype.toBuffer = function() {
        
    };
    
    BitPrototype.toArrayBuffer = function() {
        
    };

    BitPrototype.toBinary = function() {
        var _arr = [].concat(this.bitArray);
        this.isLittleEndian && _arr.reverse();
        for (var i = 0, len = _arr.length; i < len; i++) {
            _arr[i] = String.fromCharCode(_arr[i]);
        }
        return _arr.join('');
    };

    /**
     * Add leading zeros depending on the length
     *
     * @param {Object} val
     * @param {Object} len
     *
     * leadZero('100010', 10) ==> '0000100010'
     */
    function leadZero(val, len) {
        return new Array((len || 10) - val.toString().length + 1).join('0') + val;
    };

    /**
     * Converting a sufficient placeholder BINARY string from integer
     *
     * @param {Object} value
     */
    function intToBits(value) {
        if (value == null) {
            return new Array(9).join('0');
        }
        return leadZero((value || 0).toString(2), 8);
    };

    /**
     * Converting a sufficient placeholder HEX string from integer
     *
     * @param {Object} value
     */
    function intToHex(value) {
        if (value == null) {
            return new Array(3).join('0');
        }
        return leadZero((value || 0).toString(16), 2);
    };

    /**
     * Parse bitArray to HEX string
     */
    BitPrototype.toHex = function() {
        var _arr = [].concat(this.bitArray);
        for (var i = 0, len = _arr.length; i < len; i++) {
            _arr[i] = intToHex(_arr[i]);
        }
        return _arr.join('');
    };

    /**
     * Parse bitArray to format string, use to debug
     *
     * @param {Number} showType
     * @param {Number} oneRow
     */
    BitPrototype.toDebug = function(showType, oneRow) {

        oneRow = oneRow || 4;
        //Byte

        var string = this.toString();

        showType = showType || 1;

        var _arr = [].concat(this.bitArray);

        if (this.isLittleEndian) {
            _arr.reverse();
            this.currentByte = _arr.length - this.currentByte - 1;
        }

        // Fill a row
        if (_arr.length % oneRow !== 0) {
            _arr = _arr.concat(new Array((oneRow - (_arr.length % oneRow)) + 1));
        }

        var BITS = "\n";

        var _bit = '';

        var _Asc = '';
        var _Byte8 = '';

        var _Utf8 = '';
        var _Byte16 = '';

        var _Br = false;

        // info
        (showType & 1) && (BITS += '  Bit ' + new Array(66).join(' '));
        (showType & 2) && (BITS += '   U8 ');
        (showType & 4) && (BITS += '   U16');
        BITS += "\n";
        (showType & 1) && (BITS += new Array(5).join('  |-------------| '));
        (showType & 2) && (BITS += '      ');
        (showType & 4) && (BITS += '      ');
        BITS += "\n";

        for (var i = 0, len = _arr.length; i < len; i++) {

            if ((i + 1) % oneRow === 0) {
                _Br = true;
            }

            if (showType & 1) {
                if (this.currentByte === i) {
                    _bit += '[';
                } else if (this.currentByte + 1 === i) {
                    _bit += ']';
                } else {
                    _bit += ' ';
                }
                var byteData = _arr[i] != null ? intToBits(_arr[i]).split('').join(' ') : new Array(16).join(' ');
                byteData = ' ' + byteData + ' ';
                if (this.currentByte === i) {
                    byteData = byteData.split('');
                    byteData[15 - this.currentBit * 2 - 1] = '>';
                    byteData[15 - this.currentBit * 2 + 1] = '<';
                    byteData = byteData.join('');
                    _bit += byteData;
                } else {
                    _bit += byteData;
                }
            }
            if (showType & 2) {
                _Byte8 += intToBits(_arr[i]);
                if (_Byte8.length === 8) {
                    var b = parseInt(_Byte8, 2);
                    _Asc += b > 0x20 && b < 0x7f ? String.fromCharCode(b) : '.';
                    _Byte8 = '';
                }
            }
            if (showType & 4) {
                _Byte16 += intToBits(_arr[i]);
                if (_Byte16.length === 16) {
                    var b = parseInt(_Byte16, 2);
                    _Utf8 += b > 0x800 && b < 0xffff ? String.fromCharCode(b) : '..';
                    _Byte16 = '';
                }
            }
            if (_Br) {
                if (showType & 1) {
                    // End line flag
                    BITS += _bit;
                    _bit = '';
                }
                if (showType & 2) {
                    BITS += '  ' + _Asc;
                    _Asc = '';

                }
                if (showType & 4) {
                    BITS += '  ' + _Utf8;
                    _Utf8 = '';
                }

                BITS += "\n";
            }
            _Br = false;
        }

        BITS += "\n";

        return BITS;
    };

    /**
     * Print Debug data, similar to toDebug, show in console table
     *
     * @param {Object} showType RANGE:0~7 (0:debug)
     */
    BitPrototype.debug = function(showType) {
        showType = showType || 1;
        var out = console.log.bind(console);
        // ;off
        out(this.toString() + "\n ----------------------------------\n" + this.toDebug(showType));
        return this;
    };

    /**
     * Create a new Bit instance from HAX string
     *
     * @param {Object} hex
     */
    Bit.fromHex = function(hex) {
        return new Bit.writeHex(hex);
    };

    /**
     *
     * @param {Object} buffer
     */
    Bit.fromBuffer = function(buffer) {

    };

    /**
     *
     * @param {*} data ArrayBuffer, HEX, Binary, Array
     */
    Bit.wrap = function(data) {

    };

    return Bit;
});
