var awsIot = require('aws-iot-device-sdk');
var rpio = require('rpio');

rpio.open(12, rpio.OUTPUT, rpio.LOW);


rpio.write(12, rpio.HIGH);
var interval = setInterval(()=>
{
    if(rpio.read(12) == rpio.LOW){
        rpio.write(12, rpio.HIGH);
    } else {
        rpio.write(12, rpio.LOW);
    }
}
, 500);
setTimeout(()=>clearInterval(interval),10000);

var device = awsIot.device({
    keyPath: '/home/pi/certs/private.pem.key',
    certPath: '/home/pi/certs/certificate.pem.crt',
    caPath: '/home/pi/certs/caCert.crt',
    clientId: 'AIL_IoT_RPi_01',
    region: 'us-east-1'
});

//var st = `${device} fkjholjflksdjf`;

device.on('connect', function() {
    device.subscribe('LED');
});

device.on('message', function(topic, payload) 
{
    var payload = JSON.parse(payload.toString());
    //show the incoming message
    console.log(payload.light);
    if(topic == 'LED')
    {
        if(payload.light == 'on')
        {
            rpio.write(12, rpio.HIGH);
        } 
        else 
        {
            rpio.write(12, rpio.LOW);
        }
    }
});
