import {
  MD3DarkTheme,
  MD3LightTheme,
  MD3Theme,
} from 'react-native-paper';

const googleBlue = '#1A73E8';

export const lightTheme: MD3Theme = {
  ...MD3LightTheme,
  roundness: 4,
  colors: {
    ...MD3LightTheme.colors,
    primary: googleBlue,
    onPrimary: '#FFFFFF',
    primaryContainer: '#D3E3FD',
    onPrimaryContainer: '#001B3D',
    secondary: '#4F5D73',
    onSecondary: '#FFFFFF',
    secondaryContainer: '#D8E2F1',
    onSecondaryContainer: '#111C2B',
    tertiary: '#755B2F',
    onTertiary: '#FFFFFF',
    tertiaryContainer: '#F8DFA6',
    onTertiaryContainer: '#281900',
    surface: '#FAF8FF',
    surfaceVariant: '#E1E2EC',
    onSurface: '#1A1B20',
    onSurfaceVariant: '#44474F',
    outline: '#74777F',
    background: '#FAF8FF',
    onBackground: '#1A1B20',
  },
};

export const darkTheme: MD3Theme = {
  ...MD3DarkTheme,
  roundness: 4,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#A8C7FA',
    onPrimary: '#002F6C',
    primaryContainer: '#174EA6',
    onPrimaryContainer: '#D3E3FD',
    secondary: '#BBC7DB',
    onSecondary: '#253140',
    secondaryContainer: '#3B4859',
    onSecondaryContainer: '#D8E2F1',
    tertiary: '#E5C17A',
    onTertiary: '#3F2E05',
    tertiaryContainer: '#5B4618',
    onTertiaryContainer: '#F8DFA6',
    surface: '#111318',
    surfaceVariant: '#44474F',
    onSurface: '#E3E2E9',
    onSurfaceVariant: '#C5C6D0',
    outline: '#8F9099',
    background: '#111318',
    onBackground: '#E3E2E9',
  },
};
