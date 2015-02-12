(function(global, factory) {
    /* CommonJS */
    if ( typeof require === 'function' && typeof module === 'object' && module && typeof exports === 'object' && exports)
        module['exports'] = factory(global);
    /* AMD */
    else if ( typeof define === 'function' && define["amd"])
        define("Bit", function() {
            return factory(global);
        });
    /* Global */
    else
        (global["dcodeIO"] = global["dcodeIO"] || {})["Bit"] = factory(global);

})(this, function(global) {

    var Bit = function(length) {
        if (length % 4 !== 0)
            throw new RangeError('The length must be a multiple of 4!');
        this.bitArray = new Array(length);
        for (var i = 0, len = this.bitArray.length; i < len; i++) {
            this.bitArray[i] = false;
        }
        this.length = length;
        this.currentOffset = -1;
        this.islittleEndian = false;
    };

    Bit.fromHex = function(hex) {
        return new Bit(hex.length * 4).writeHex(hex, 0, hex.length * 4, true);
    };

    var BitItem = {
        Binarify : function(v) {
            return !!(v === '0' && ( v = null), v);
        },
        Intify : function(v) {
            return v ? 1 : 0;
        }
    };

    var BitPrototype = Bit.prototype;

    BitPrototype.writeBit = function(bitInstace) {
        arguments[0] = bitInstace.bitArray;
        return this.writeBitArray.apply(this, arguments);
    };

    BitPrototype.writeString = function(string) {
        arguments[0] = arguments[0].toString(2).split('');
        return this.writeBitArray.apply(this, arguments);
    };

    BitPrototype.writeInteger = function(integer) {
        return this.writeString.apply(this, arguments);
    };

    BitPrototype.writeUTF8String = function(string) {
        arguments[0] = Array.prototype.concat.apply([], arguments[0].split('').map(function(c) {
            return new Bit(8).write(c.charCodeAt().toString(2), 0, 8, true).bitArray;
        }));
        return this.writeBitArray.apply(this, arguments);
    };

    BitPrototype.writeUTF16String = function(string) {
        arguments[0] = Array.prototype.concat.apply([], arguments[0].split('').map(function(c) {
            return new Bit(16).write(c.charCodeAt().toString(2), 0, 16, true).bitArray;
        }));
        return this.writeBitArray.apply(this, arguments);
    };

    BitPrototype.writeHex = function(hex) {
        arguments[0] = parseInt(arguments[0], 16);
        return this.writeInteger.apply(this, arguments);
    };

    BitPrototype.writeBitArray = function(array, Begin, End, islittleEndian) {

        var arrlen = array.length;
        var offset;
        islittleEndian = !!(islittleEndian || this.islittleEndian || false);

        if (this.currentOffset < 0) {
            this.currentOffset = 0;
        }

        if (!(Begin > -1)) {
            Begin = this.currentOffset;
        }
        else {
            if (Begin > this.length) {
                return this;
            }
        }

        if (!(End > -1) || End <= Begin) {
            if (Begin + arrlen > this.length) {
                End = this.length;
                array.splice(End - Begin - arrlen);
            }
            else {
                End = Begin + arrlen;
            }
        }
        else {
            var limit = Math.min(End, this.length, Begin + arrlen);
            if (limit - Begin < arrlen) {
                array.splice(limit - Begin - arrlen);
                End = limit;
            }
            else {
                End = Math.min(End, this.length);
            }
        }
        arrlen = array.length;

        if (islittleEndian) {
            offset = End - Begin - arrlen;
        }
        else {
            offset = 0;
        }

        Array.prototype.splice.apply(this.bitArray, [Begin + offset, arrlen].concat(array.map(BitItem.Binarify)));

        this.mark(End);
        this.lastWrittenBegin = Begin;
        this.lastWrittenEnd = End;
        return this;
    };

    BitPrototype.write = function(value) {
        if (Object.prototype.toString.call(value) === '[object Object]' && 'bitArray' in value) {
            return this.writeBit.apply(this, arguments);
        }
        else if (Object.prototype.toString.call(value) === '[object Array]' && value.length) {
            return this.writeBitArray.apply(this, arguments);
        }
        else if ( typeof value === 'string') {
            return this.writeString.apply(this, arguments);
        }
        else if ( typeof value === 'number') {
            return this.writeInteger.apply(this, arguments);
        }
        return this;
    };

    BitPrototype.toString = function() {
        return this.bitArray.map(BitItem.Intify).join('');
    };

    BitPrototype.toDebug = function(showType) {

        var string = this.toString();

        showType = showType || 1;

        if (string.length % 32 !== 0) {
            string += new Array((32 - (string.length % 32)) + 1).join(' ');
        }

        var BITS = "\n";

        var _bit = '';

        var _Asc = '';
        var _Byte8 = '';

        var _Utf8 = '';
        var _Byte16 = '';

        var _Br = false;

        // info
        (showType & 1) && (BITS += ' Bit' + new Array(61).join(' '));
        (showType & 2) && (BITS += '  U8  ');
        (showType & 4) && (BITS += '  U16 ');
        BITS += "\n";

        // info
        (showType & 1) && (BITS += new Array(5).join(' |-------------|'));
        (showType & 2) && (BITS += '      ');
        (showType & 4) && (BITS += '      ');
        BITS += "\n";

        for (var i = 0, len = string.length; i < len; i++) {

            if ((i + 1) % 32 === 0) {
                _Br = true;
            }

            if (showType & 1) {
                if (this.currentOffset === i) {
                    _bit += '[';
                }
                else if (this.lastWrittenBegin === i) {
                    _bit += '<';
                }
                else if (this.lastWrittenEnd === i) {
                    _bit += '>';
                }
                else {
                    _bit += ' ';
                }
                _bit += string.charAt(i);
            }

            if (showType & 2) {
                _Byte8 += string.charAt(i);
                if (_Byte8.length === 8) {
                    var b = parseInt(_Byte8, 2);
                    _Asc += b > 0x20 && b < 0x7f ? String.fromCharCode(b) : '.';
                    _Byte8 = '';
                }
            }
            if (showType & 4) {
                _Byte16 += string.charAt(i);
                if (_Byte16.length === 16) {
                    var b = parseInt(_Byte16, 2);
                    _Utf8 += b > 0x800 && b < 0xffff ? String.fromCharCode(b) : '..';
                    _Byte16 = '';
                }
            }

            if (_Br) {
                if (showType & 1) {
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

    BitPrototype.toHex = function() {
        var Hex = [];
        for (var i = 0, l = this.bitArray.length; i < l; i += 4) {
            var Bit4 = 0;
            for (var p = 0; p < 4; p++) {
                Bit4 += BitItem.Intify(this.bitArray[i + p]) << (3 - p);
            }
            Hex.push(Bit4.toString(16));
        }

        return Hex.join('');
    };

    BitPrototype.mark = function(Offset) {
        if (Offset > -1) {
            this.currentOffset = Offset > this.length ? this.length : Offset;
        }
        return this;
    };

    BitPrototype.debug = function(showType) {
        showType = showType || 1;
        var out = console.log.bind(console);
        out(this.toString() + "\n" + "-------------------------------------------------------------------\n" + this.toDebug(showType));
        return this;
    };

    global.Bit = Bit;

});
