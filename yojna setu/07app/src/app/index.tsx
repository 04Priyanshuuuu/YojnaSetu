import { View, Text } from 'react-native';

export default function HomeScreen() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ffffff',
      }}
    >
      <Text
        style={{
          fontSize: 30,
          fontWeight: 'bold',
          color: '#7A1F3D',
        }}
      >
        YojnaSetu
      </Text>

      <Text
        style={{
          marginTop: 10,
          fontSize: 16,
          color: '#555555',
        }}
      >
        Government Schemes Made Simple
      </Text>
    </View>
  );
}