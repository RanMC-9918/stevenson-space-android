import { Pressable, View } from 'react-native';
import { Icon, MD3Theme, Text } from 'react-native-paper';

type Props = {
  theme: MD3Theme;
  label: string;
  onPress: () => void;
};

export function DateLink({ theme, label, onPress }: Props) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'flex-start', marginTop: 6 }}>
        <Icon source="calendar-month" size={18} color={theme.colors.primary} />
        <Text
          variant="labelLarge"
          style={{
            color: theme.colors.primary,
            marginLeft: 6,
          }}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}
