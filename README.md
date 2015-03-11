# Bit.js #

## Bit ##

### Property ###

- bitArray
- Length
- originalLength
- currentByte
- currentBit

### Method ###

![](http://ww1.sinaimg.cn/large/699ef9c0jw1ep5yjgyqk3j20g00gj0v1.jpg)

## Bit操作 ##

位写入位为由地位至高位，写满8位进入下一byte，byte写入顺序由cpu架构决定，JS方面可进行配置。

eg:

int 4
int 1
int 1
int 3
int 7

(1000)(0)(1)(101)(0100000)


大端写
|--------| |--------|
|(<-01)(1)(0)(1000)| |(0100000)(1->)|

小端写
|--------| |--------|
|(0100000)(1->)| |(<-01)(1)(0)(1000)|

网络层协议均为大端写