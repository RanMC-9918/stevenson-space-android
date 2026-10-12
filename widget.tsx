import { registerWidgetTaskHandler, type WidgetTaskHandlerProps, FlexWidget, TextWidget } from 'react-native-android-widget';

function StevensonWidget() {
  return (
    <FlexWidget style={{ backgroundColor: '#1e293b', borderRadius: 28, padding: 16, flexDirection: 'column' }}>
      <TextWidget text="Stevenson Space" style={{ color: '#f8fafc', fontSize: 18, fontWeight: '700' }} />
      <TextWidget text="Open the app for today's schedule" style={{ color: '#cbd5e1', fontSize: 13, marginTop: 8 }} />
    </FlexWidget>
  );
}

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  props.renderWidget(<StevensonWidget />);
}

registerWidgetTaskHandler(widgetTaskHandler);
