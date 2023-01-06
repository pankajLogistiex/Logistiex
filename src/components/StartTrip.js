import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {NativeBaseProvider, Box, Image, Center, VStack, Button, Icon, Input, Heading, Alert, Text, Modal } from 'native-base';
import { useNavigation } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { PermissionsAndroid, Pressable, SafeAreaView, StyleSheet, TouchableHighlight, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { decode } from "react-native-pure-jwt";
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import Marker from 'react-native-image-marker';


export default function StartTrip() {

  const [vehicle, setVehicle] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState(0);
  const [loginClicked, setLoginClicked] = useState(false);
  const [ImageUrl, setImageUrl] = useState('');
  const [tripValue, setTripValue] = useState('Start Trip');
  const [tripID, setTripID] = useState("");
  const navigation = useNavigation();

  const requestCameraPermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Camera Permission',
          message: 'App needs camera permission',
        },
      );
      // If CAMERA Permission is granted
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
  };

  const createFormData = (photo, body) => {
    const data = new FormData();
  
    data.append("file", {
      name: photo.fileName,
      type: photo.type,
      uri:
        Platform.OS === "android" ? photo.uri : photo.uri.replace("file://", "")
    });
  
    Object.keys(body).forEach(key => {
      data.append(key, body[key]);
    });
    return data;
  };

  const storeData = async(data) => {
    try {
      await AsyncStorage.setItem('@TripID', JSON.stringify(data));
      getData();
    } catch (e) {
      console.log(e);
    }
  }

  const storeDataTripValue = async() => {
    try {
      await AsyncStorage.setItem('@StartEndTrip', JSON.stringify('End Trip'));
    } catch (e) {
      console.log(e);
    }
  }

  const getData = async () => {
    try {
      const value = await AsyncStorage.getItem('@TripID')
      if(value !== null) {
        const data = JSON.parse(value);
        setTripID(data);
      }
    } catch(e) {
      console.log(e);
    }
  }

  const takePhoto= async()=>{
    let options = {
        mediaType:'photo',
        quality:1,
        cameraType:'back',
        maxWidth : 480,
        maxHeight : 480,
        storageOptions: {
          skipBackup: true,
          path: 'images',
        },
    }
    let isGranted = await requestCameraPermission();
    let result = null;
    if(isGranted){
        result = await launchCamera(options);
        console.log(result)
    }
    if(result.assets !== undefined){          
      fetch('https://bked.logistiex.com/DSQCPicture/uploadPicture', {
        method: 'POST',
        body: createFormData(result.assets[0], {
                useCase : "DSQC",
                type : "front",
                contextId : "SI002",
                contextType: "shipment",
                hubCode :"HC001"
              }),
      })
      .then((data) => data.json())
      .then((res) => {
        setImageUrl(res.publicURL);
        console.log('upload succes', res);
      })
      .catch((error) => {
        console.log('upload error', error);
      });
    }
}

useEffect(() => {
  storeData(new Date() + "UI001");
}, []);

const ImageHandle = () => 
  {
    (async() => {
        await axios.post('https://bked.logistiex.com/UserTripInfo/userTripDetails', {
        tripID : tripID, 
        userID : "UI001", 
        date : new Date(), 
        startTime : "10:00AM", 
        vehicleNumber : vehicle, 
        startKilometer : password, 
        startVehicleImageUrl : ImageUrl
        })
        .then(function (res) {
          console.log('dscsdc', res.data);
          storeDataTripValue();
        })
        .catch(function (error) {
          console.log(error);
        });
    }) ();
   }

  return (
    <NativeBaseProvider>
        <Box flex={1} bg="#004aad" alignItems="center" pt={'40%'}>
            <Box justifyContent="space-between" py={10} px={6} bg="#fff" rounded="xl" width={"90%"} maxWidth="100%" _text={{fontWeight: "medium",}}>
            <VStack space={6}>
                <Input value={vehicle} onChangeText={setVehicle} size="lg" placeholder="Enter your vehical no." />
                <Input keyboardType="numeric" value={password} onChangeText={setPassword} size="lg" type={"number"} placeholder="Input vehicle KMs" />
                <Button title="Login" marginX={6}  variant="outline"  _text={{ color: 'white', fontSize: 20 }} onPress={()=>takePhoto()}><MaterialIcons name="cloud-upload" size={20} mr="2" color="#004aad">Image</MaterialIcons></Button>
                {
                  password && vehicle && ImageUrl && tripID ? (
                    <Button  title="Login" backgroundColor= {'#004aad'} _text={{ color: 'white', fontSize: 20 }} onPress={()=>ImageHandle()}>Start Trip</Button>
                  ) : (
                    <Button marginTop={20} marginX={8} opacity={0.5}  disabled={true} title="Login" backgroundColor= {'#004aad'} _text={{ color: 'white', fontSize: 20 }}>Start Trip</Button>
                  )
                }
            </VStack>
        </Box>
        <Center>
            <Image style={{ width: 200, height: 200 }} source={require('../assets/logo.png')} alt={"Logo Image"} />
            
        </Center>
        </Box>
    </NativeBaseProvider>
  );
}
   