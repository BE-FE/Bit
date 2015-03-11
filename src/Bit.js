(function(global, factory) {
    /* CommonJS */
    if( typeof require === 'function' && typeof module === 'object' && module && typeof exports === 'object' && exports)
        module['exports'] = factory(global);
    /* AMD */
    else if( typeof define === 'function' && define['amd'])
        define('Bit', function() {
            return factory(global);
        });
    /* Global */
    else
        global['Bit'] = factory(global);
})( window ? window : this, function(global) {

    var BitString = function(str) {
        this.length = str.length;
        return str;
    };

    var Bit = function(length, isLittleEndian) {

        this.isLittleEndian = !!isLittleEndian || false;
        this.length = length || 8;
        this.originalLength = 0;

        this.bitArray = new Array(this.length / 8);
        for(var i = 0, len = this.bitArray.length; i < len; i++) {
            this.bitArray[i] = 0;
        }
        this.currentByte = 0;
        this.currentBit = 0;
    };

    var BitPrototype = Bit.prototype;

    /**
     * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     * NEW replacement
     * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     */
    BitPrototype.isBitString = function(value) {
        return typeof value === 'string' && !/[^01]/.test(value);
    };

    /**
     * New
     *
     * Write value
     *
     * @param {*} value
     * @param {Object} length
     */
    BitPrototype.write = function(value, length) {
        if(Object.prototype.toString.call(value) === '[object Object]' && 'bitArray' in value && value instanceof Bit) {
            return this.writeBit.apply(this, arguments);
        } else if( typeof value === 'string') {
            return this.writeString.apply(this, arguments);
        } else if( typeof value === 'number') {
            return this.writeInt.apply(this, arguments);
        }
        return this;
    };

    /**
     * @param {Object} Bit Instace
     * @param {Number} length
     */
    BitPrototype.writeBit = function(bitInstace, length) {
        arguments[0] = bitInstace.toBitString();
        if(length == null) {
            arguments[1] = bitInstace.originalLength;
        }
        return this.writeBitString.apply(this, arguments);
    };

    /**
     * @param {String} str
     * @param {Number} length
     */
    BitPrototype.writeString = function(str, length) {
        if(/^[\x00-\xff]+$/.test(str)) {
            return this.writeUTF8String.apply(this, arguments);
        } else {
            return this.writeUTF16String.apply(this, arguments);
        }
    };

    /**
     * @param {String} str
     * @param {Number} length
     */
    BitPrototype.writeUTF8String = function(str, length) {
        var _C = '';
        for(var i = 0, len = str.length; i < len; i++) {
            _C += leadZero(str.charAt(i).charCodeAt().toString(2), 8);
        }
        arguments[0] = _C;
        return this.writeBitString.apply(this, arguments);
    };

    /**
     * @param {String} str
     * @param {Number} length
     */
    BitPrototype.writeUTF16String = function(str, length) {
        var _C;
        for(var i = 0, len = str.length; i < len; i++) {
            _C += leadZero(str.charAt(i).charCodeAt().toString(2), 16);
        }
        arguments[0] = _C;
        return this.writeBitString.apply(this, arguments);
    };

    /**
     * @param {Number} integer
     */
    BitPrototype.writeInt = function(integer) {
        arguments[0] = integer.toString(2);
        return this.writeBitString.apply(this, arguments);
    };

    /**
     * Write HEX to BitArray
     * @param {String} HEX
     *
     * 'A065E34D...'
     * OR
     * 'A0 65 E3 4D ...'
     */
    BitPrototype.writeHex = function(HEX) {
        var _S = [];
        HEX = HEX.replace(/\x20+/, '');
        for(var i = 0, len = HEX.length; i < len; i += 2) {
            _S.push(intToBits(parseInt(HEX.charAt(i) + HEX.charAt(i + 1), 16)));
        }
        arguments[0] = _S.join('');
        return this.writeBitString.apply(this, arguments);
    };

    /**
     * New
     *
     * Write Integer value
     *
     * @param {Object} value
     * @param {Object} length
     *
     * eg:
     *  value = '011000100010101';
     *  length = 5
     *
     *  ==> '10101'
     */
    BitPrototype.writeBitString = function(value, length) {

        if(value == null) {
            return this;
        }

        if(!this.isBitString(value)) {
            throw new TypeError('Type must be a BitString');
            return this;
        }

        if(length == null) {
            length = value.length;
        }

        if(length <= 0) {
            return this;
        }

        // Is the same as the positive and negative
        length = Math.abs(length);

        var _S = value;

        if(_S.length > length) {
            _S = _S.slice(-length);
        } else if(_S.length < length) {
            _S = leadZero(_S, length);
        }

        //console.log(_S);
        var _V;
        while(_S.length > 0) {
            // Data
            _V = _S.slice(this.currentBit - 8);
            // Remaining
            _S = _S.slice(0, this.currentBit - 8);

            if(this.bitArray[this.currentByte] == null) {
                this.bitArray[this.currentByte] = 0;
            }
            this.bitArray[this.currentByte] = this.bitArray[this.currentByte] + (parseInt(_V, 2) << this.currentBit);
            this.currentByte = this.currentByte + Math.floor((this.currentBit + _V.length) / 8);
            this.currentBit = (this.currentBit + _V.length) % 8;
        }

        this.byteLength = this.bitArray.length;
        this.length = this.byteLength * 8;
        this.originalLength = this.currentByte * 8 + this.currentBit;

        return this;
    };

    /**
     * Set current block(byte) pointer offset
     * @param {Number} num
     */
    BitPrototype.setCurrentByte = function(num) {
        this.currentByte = num;
        return this;
    };

    /**
     * Set current bit pointer offset in byte
     * 0~7
     * @param {Number} num
     */
    BitPrototype.setCurrentBit = function(num) {
        this.currentBit = num;
        return this;
    };

    /**
     * Move to next block(byte)
     * currentByte + 1
     * currentByte = 0
     */
    BitPrototype.nextByte = function() {
        this.setCurrentByte(this.currentByte + 1);
        this.setCurrentBit(0);
        return this;
    };

    BitPrototype.getUint8 = function(from) {
        if(this.bitArray.length < 1) {
            throw new RangeError('Unable to meet Uint8, at least 8 bits');
        }
        from = from || 0;
        return new Uint8Array(this.bitArray.slice(0, 1));
    };

    BitPrototype.getUint32 = function(from) {
        if(this.bitArray.length < 4) {
            throw new RangeError('Unable to meet Uint32, at least 32 bits');
        }
        from = from || 0;
        var _arr = this.bitArray.slice(0, 4);
        this.isLittleEndian && _arr.reverse();
        return new Uint32Array();
    };

    BitPrototype.toBitString = function() {
        var _arr = [].concat(this.bitArray);
        for(var i = 0, len = _arr.length; i < len; i++) {
            _arr[i] = (i == len - 1) ? _arr[i].toString(2) : intToBits(_arr[i]);
        }
        return _arr.join('');
    };

    BitPrototype.toInt32 = function() {
        var _arr = [].concat(this.bitArray.slice(0, 4));
        this.isLittleEndian && _arr.reverse();
        var _V = 0;
        for(var i = 0, len = _arr.length; i < len; i++) {
            _V += _arr[i] << (2 * (len - 1 - i));
        }
        return _V;
    };

    BitPrototype.toBinary = function() {
        var _arr = [].concat(this.bitArray);
        this.isLittleEndian && _arr.reverse();
        for(var i = 0, len = _arr.length; i < len; i++) {
            _arr[i] = String.fromCharCode(_arr[i]);
        }
        return _arr.join('');
    };

    function leadZero(val, len) {
        return new Array((len || 10) - val.toString().length + 1).join('0') + val;
    };

    function intToBits(value) {
        if(value == null) {
            return new Array(9).join('0');
        }
        return leadZero((value || 0).toString(2), 8);
    };

    function intToHex(value) {
        if(value == null) {
            return new Array(3).join('0');
        }
        return leadZero((value || 0).toString(16), 2);
    };

    BitPrototype.toDebug = function(showType, oneRow) {

        oneRow = oneRow || 4;
        //Byte

        var string = this.toString();

        showType = showType || 1;

        var _arr = [].concat(this.bitArray);

        //test
        this.isLittleEndian && _arr.reverse();

        // Fill a row
        if(_arr.length % oneRow !== 0) {
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

        for(var i = 0, len = _arr.length; i < len; i++) {

            if((i + 1) % oneRow === 0) {
                _Br = true;
            }

            if(showType & 1) {
                if(this.currentByte === i) {
                    _bit += '[';
                } else if(this.currentByte + 1 === i) {
                    _bit += ']';
                } else {
                    _bit += ' ';
                }

                _bit += ' ';
                var byteData = intToBits(_arr[i]).split('').join(' ');
                if(this.currentByte === i) {
                    byteData = byteData.split('');
                    byteData[14 - this.currentBit * 2 - 1] = '>';
                    byteData[14 - this.currentBit * 2 + 1] = '<';
                    byteData = byteData.join('');
                }
                _bit += byteData;
                _bit += ' ';
            }
            if(showType & 2) {
                _Byte8 += intToBits(_arr[i]);
                if(_Byte8.length === 8) {
                    var b = parseInt(_Byte8, 2);
                    _Asc += b > 0x20 && b < 0x7f ? String.fromCharCode(b) : '.';
                    _Byte8 = '';
                }
            }
            if(showType & 4) {
                _Byte16 += intToBits(_arr[i]);
                if(_Byte16.length === 16) {
                    var b = parseInt(_Byte16, 2);
                    _Utf8 += b > 0x800 && b < 0xffff ? String.fromCharCode(b) : '..';
                    _Byte16 = '';
                }
            }
            if(_Br) {
                if(showType & 1) {
                    // End line flag
                    BITS += _bit;
                    _bit = '';
                }
                if(showType & 2) {
                    BITS += '  ' + _Asc;
                    _Asc = '';

                }
                if(showType & 4) {
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

    BitPrototype.toHex = function() {
        var _arr = [].concat(this.bitArray);
        for(var i = 0, len = _arr.length; i < len; i++) {
            _arr[i] = intToHex(_arr[i]);
        }
        return _arr.join('');
    };

    Bit.fromHex = function(hex) {
        return new Bit.writeHex(hex);
    };

    BitPrototype.debug = function(showType) {
        showType = showType || 1;
        var out = console.log.bind(console);
        // ;off
        out(this.toString() + "\n ----------------------------------\n" + this.toDebug(showType));
        return this;
    };

    return Bit;
});
