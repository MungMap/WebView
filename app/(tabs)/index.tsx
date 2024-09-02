import React, { useState, useEffect, useRef } from "react";
import { SafeAreaView, StyleSheet, Platform, Alert } from "react-native";
import { WebView as RNWebView } from "react-native-webview";
import * as Location from "expo-location";
import { Tabs } from "expo-router";

declare global {
  interface Window {
    ReactNativeWebView?: any;
    getReactNativeLocation?: any;
  }
}

export default function App() {
  const [location, setLocation] = useState<any>(null);
  const webViewRef = useRef<any>(null);

  useEffect(() => {
    try {
      (async () => {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          console.error("Permission to access location was denied");
          return;
        }
        let location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setLocation(location);
      })();
    } catch (err) {
      Alert.alert("Can't find you.", "Please Try Again!");
    }
  }, []);

  useEffect(() => {
    if (location && webViewRef.current) {
      const { latitude, longitude } = location.coords;
      const script = `
          window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'location',
            latitude: ${JSON.stringify(latitude)},
            longitude: ${JSON.stringify(longitude)}
          }));
        `;
      webViewRef?.current?.injectJavaScript &&
        webViewRef?.current?.injectJavaScript(script);
    }
  }, [location]);

  const handleMessage = (event: any) => {
    const data = JSON.parse(event.nativeEvent.data);
    if (data.type === "getLocation") {
      if (location) {
        const { latitude, longitude } = location.coords;
        const script = `
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'location',
            latitude: ${JSON.stringify(latitude)},
            longitude: ${JSON.stringify(longitude)}
          }));
        `;
        webViewRef.current.injectJavaScript &&
          webViewRef.current.injectJavaScript(script);
      }
    }
  };

  // 웹뷰 컴포넌트를 플랫폼에 따라 다르게 설정
  const WebView = Platform.OS === "web" ? "iframe" : RNWebView;

  return (
    <SafeAreaView style={styles.container}>
      {Platform.OS === "web" ? (
        <iframe
          ref={webViewRef}
          src="https://mung-map.netlify.app"
          // src="http://localhost:3000"
          style={{ flex: 1, width: "100%", height: "100%" }}
          onLoad={() => {
            const script = `
              window.getReactNativeLocation = function() {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'getLocation' }));
              };
            `;
            // webViewRef.current?.contentWindow?.eval(script);
          }}
        />
      ) : (
        <RNWebView
          ref={webViewRef}
          source={{ uri: "https://mung-map.netlify.app" }}
          // source={{ uri: "http://localhost:3000" }}
          style={styles.webview}
          onMessage={handleMessage}
          injectedJavaScript={`
            window.getReactNativeLocation = function() {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'getLocation' }));
            };
          `}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
});
