# react-native-bluetooth-escpos-printer

React-Native plugin for the bluetooth ESC/POS & TSC printers.

If your are using this lib. The code example on file `BluetoothConfig.js` can help you.

## Installation
### Step 1 ###
Install via NPM [Check In NPM](https://www.npmjs.com/package/react-native-bluetooth-escpos-printer)
```bash
npm install react-native-bluetooth-escpos-printer --save
```

Or install via github
```bash
npm install https://github.com/januslo/react-native-bluetooth-escpos-printer.git --save
```

### Step2 ###
Link the plugin to your RN project
```bash
react-native link react-native-bluetooth-escpos-printer
```


### Step3 ###
Refers to your JS files
```javascript
    import {BluetoothManager,BluetoothEscposPrinter,BluetoothTscPrinter} from 'react-native-bluetooth-escpos-printer';
```

## Usage ##
If you need print in other screen in your project you need follow the sequence.

### Step 1 ###
Connect on printer
Using `BluetoothConfig.js` you scan devices and test print.

### Step 2 ###
To print in others screens you need use the code:

```javascript
import {
  BluetoothEscposPrinter,
  BluetoothManager
} from 'react-native-bluetooth-escpos-printer';
.
.
.
// Something like
<Button
    onPress={async () => {
    await BluetoothEscposPrinter.printerInit();
    await BluetoothEscposPrinter.printText("Test print success.!!!\r\n\r\n", {});
    }} title="Test Print"/>
```