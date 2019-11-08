import React, { Component } from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  View,
  Button,
  ScrollView,
  DeviceEventEmitter,
  NativeEventEmitter,
  Switch,
  TouchableOpacity,
  Dimensions,
  ToastAndroid,
  AsyncStorage
} from 'react-native';
import {
  BluetoothEscposPrinter,
  BluetoothManager
} from 'react-native-bluetooth-escpos-printer';
import {
  Container,
  Content
} from 'native-base';
import {
  Header
} from 'react-native-elements';
import HamburgerMenu from '../components/HamburguerMenu';
import { showError } from '../components/Alerts';

const {
  height,
  width
} = Dimensions.get('window');

export default class BluetoothConfig extends Component {
  _listeners = [];

  constructor() {
    super();
    this.state = {
      devices: null,
      pairedDs: [],
      foundDs: [],
      bleOpend: false,
      loading: true,
      boundAddress: '',
      name: '',
      iscon: 0,
      debugMsg: '',
    };
  }

  componentDidMount() {
    BluetoothManager.isBluetoothEnabled().then((enabled) => {
      this.setState({
        bleOpend: Boolean(enabled),
        loading: false
      });
    }, (err) => {
      showError(err);
    });

    if (Platform.OS === 'ios') {
      const bluetoothManagerEmitter = new NativeEventEmitter(BluetoothManager);
      this._listeners.push(bluetoothManagerEmitter.addListener(BluetoothManager.EVENT_DEVICE_ALREADY_PAIRED,
        (rsp) => {
          this._deviceAlreadPaired(rsp);
        }));
      this._listeners.push(bluetoothManagerEmitter.addListener(BluetoothManager.EVENT_DEVICE_FOUND, (rsp) => {
        this._deviceFoundEvent(rsp);
      }));
      this._listeners.push(bluetoothManagerEmitter.addListener(BluetoothManager.EVENT_CONNECTION_LOST, () => {
        this.setState({
          name: '',
          boundAddress: ''
        });
      }));
    } else if (Platform.OS === 'android') {
      this._listeners.push(DeviceEventEmitter.addListener(
        BluetoothManager.EVENT_DEVICE_ALREADY_PAIRED, (rsp) => {
          this._deviceAlreadPaired(rsp);
        }
      ));
      this._listeners.push(DeviceEventEmitter.addListener(
        BluetoothManager.EVENT_DEVICE_FOUND, (rsp) => {
          this._deviceFoundEvent(rsp);
        }
      ));
      this._listeners.push(DeviceEventEmitter.addListener(
        BluetoothManager.EVENT_CONNECTION_LOST, () => {
          this.setState({
            name: '',
            boundAddress: ''
          });
        }
      ));
      this._listeners.push(DeviceEventEmitter.addListener(
        BluetoothManager.EVENT_BLUETOOTH_NOT_SUPPORT, ()=> {
          ToastAndroid.show('Device Not Support Bluetooth !', ToastAndroid.LONG);
        }
      ));
    }
    this._getData();
  }

  componentWillUnmount() {
    //  for (let ls in this._listeners) {
    //    this._listeners[ls].remove();
    //  }
  }

  _deviceAlreadPaired = (rsp) => {
    let ds = null;
    if (typeof (rsp.devices) === 'object') {
      ds = rsp.devices;
    } else {
      try {
        ds = JSON.parse(rsp.devices);
      } catch (e) {
        // ignore
      }
    }
    if (ds && ds.length) {
      let pared = this.state.pairedDs;
      pared = pared.concat(ds || []);
      this.setState({
        pairedDs: pared
      });
    }
  }

  _deviceFoundEvent = (rsp) => {
    const r = null;
    try {
      if (typeof (rsp.device) === 'object') {
        r = rsp.device;
      } else {
        r = JSON.parse(rsp.device);
      }
    } catch (e) {
      showError(e);
    }
    if (r) {
      const found = this.state.foundDs || [];
      if (found.findIndex) {
        const duplicated = found.findIndex(x => x.address === r.address);
        // CHECK DEPLICATED HERE...
        if (duplicated === -1) {
          found.push(r);
          this.setState({
            foundDs: found
          });
        }
      }
    }
  }

    _getData = async () => {
      try {
        const dlog = await AsyncStorage.getItem('@dataprinter');

        JSON.parse(dlog, (key, value) => {
          if (key === 'boundAddress') this.setState({ boundAddress: value });
          if (key === 'name') this.setState({ name: value });
          if (key === 'iscon') this.setState({ iscon: value });
        });
      } catch (e) {
        // error reading value
        showError(`err: ${e}`);
      }
    }

    _storeData = async (data) => {
      try {
        const NewData = {
          boundAddress: data.boundAddress,
          name: data.name,
          iscon: data.iscon,
        };
        await AsyncStorage.setItem('@dataprinter',JSON.stringify(NewData));
      } catch (error) {
        // Error saving data
        showError(`err: ${error}`);
      }
    };

    _renderRow = (rows) => {
      const items = [];
      for (const i in rows) {
        const row = rows[i];
        if (row.address) {
          items.push(
            <TouchableOpacity
              key={new Date().getTime() + i}
              stlye={styles.wtf} onPress={()=>{
                this.setState({loading: true});
                BluetoothManager.connect(row.address).then((s) => {
                  this.setState({
                    loading: false,
                    boundAddress: row.address,
                    name: row.name || 'UNKNOWN'
                  });
                  const NewItems = [];
                  NewItems = {
                    boundAddress: row.address,
                    name: row.name || 'UNKNOWN',
                    iscon: 1,
                  }
                      this._storeData(NewItems);
                },(e) => {
                  this.setState({
                    loading: false
                  })
                  showError(e);
                })
              }}
            >
              <Text style={styles.name}>{row.name || 'UNKNOWN'}</Text>
              <Text
                  style={styles.address}>{row.address}
              </Text>
            </TouchableOpacity>
          );
        }
      }
      return items;
    }

    _selfTest() {
      this.setState({
        loading: true
      }, () => {
        BluetoothEscposPrinter.selfTest(() => {
        });

        this.setState({
          loading: false
        });
      });
    }

    _scan() {
      this.setState({
        loading: true
      });
      BluetoothManager.scanDevices()
        .then((s) => {
          const ss = s;
          let { found } = ss;
          try {
            found = JSON.parse(found);// @FIX_it: the parse action too weired..
          } catch (e) {
            // ignore
          }
          let fds = this.state.foundDs;
          if (found && found.length) {
            fds = found;
          }
          this.setState({
            foundDs: fds,
            loading: false
          });
        }, (er) => {
          this.setState({
            loading: false
          });
          showError(`error${JSON.stringify(er)}`);
        });
    }

    render() {
      return (
        <Container>
          <Header
            leftComponent={<HamburgerMenu navigation={this.props.navigation} />}
            centerComponent={{ text: 'Configuração Impressora', style: { color: '#FFF' }, fontFamily: 'Nexa Light' }}
            containerStyle={{ backgroundColor: '#B8D05B' }}
          />
          <Content padder>
            <ScrollView style={styles.container}>
              <Text>{this.state.debugMsg}</Text>
              <Text style={styles.title}>
                Bluetooth Opended: 
                {' '}
                {this.state.bleOpend ? 'true':'false'} 
                <Text>Open BLE Before Scanning</Text>
              </Text>
              <View>
                <Switch
                  value={this.state.bleOpend}
                  onValueChange={(v) => {
                    this.setState({ loading: true });
                    if (!v) {
                      BluetoothManager.disableBluetooth().then(() => {
                        this.setState({
                          bleOpend: false,
                          loading: false,
                          foundDs: [],
                          pairedDs: []
                        });
                      },
                      (err) => { showError(err); });
                    } else {
                      BluetoothManager.enableBluetooth().then((r) => {
                        const paired = [];
                        if (r && r.length > 0) {
                          for (let i = 0; i < r.length; i++) {
                            try {
                              paired.push(JSON.parse(r[i]));
                            } catch (e) {
                            // ignore
                            }
                          }
                        }
                        this.setState({
                          bleOpend: true,
                          loading: false,
                          pairedDs: paired
                        });
                      }, (err) => {
                        this.setState({
                          loading: false
                        });
                        showError(err);
                      });
                    }
                  }}
                />
                <Button
                  disabled={this.state.loading || !this.state.bleOpend}
                  onPress={() => {
                    this._scan();
                  }}
                  title="Scan"
                />
              </View>
              <Text style={styles.title}>
                Connected:
                <Text style={{ color: 'blue' }}>
                  {!this.state.name ? 'No Devices' : this.state.name}
                </Text>
              </Text>
              <Text style={styles.title}>Found(tap to connect):</Text>
              {this.state.loading ? (<ActivityIndicator animating />) : null}
              <View style={{ flex: 1, flexDirection: 'column' }}>
                {
                    this._renderRow(this.state.foundDs)
                }
              </View>
              <Text style={styles.title}>Paired:</Text>
              {this.state.loading ? (<ActivityIndicator animating />) : null}
              <View style={{ flex: 1, flexDirection: 'column' }}>
                {
                  this._renderRow(this.state.pairedDs)
                }
              </View>

              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-around',
                paddingVertical: 30
              }}
              >
                <Button
                  disabled={this.state.loading || !(this.state.bleOpend && this.state.boundAddress.length > 0 )}
                  onPress={async () => {
                    await BluetoothEscposPrinter.printerInit();
                    await BluetoothEscposPrinter.printText('Print OKE !!!\r\n\r\n', {});
                  }}
                  title="Test Print"
                />
              </View>
            </ScrollView>
          </Content>
        </Container>
      );
    }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5FCFF',
  },
  title: {
    width,
    backgroundColor: '#eee',
    color: '#232323',
    paddingLeft: 8,
    paddingVertical: 4,
    textAlign: 'left'
  },
  wtf: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  name: {
    flex: 1,
    textAlign: 'left'
  },
  address: {
    flex: 1,
    textAlign: 'right'
  }
});
