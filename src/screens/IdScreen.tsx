import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { extractTextFromImage } from 'expo-text-extractor';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, MD3Theme, Text, TextInput } from 'react-native-paper';
import { clearSavedId, saveSavedId, SavedId } from '../storage';
import { styles } from '../styles';

type Props = { theme: MD3Theme; savedId: SavedId | null; onSaved: (id: SavedId | null) => void; editing: boolean; onEditingChange: (editing: boolean) => void };

export function IdScreen({ theme, savedId, onSaved, editing, onEditingChange }: Props) {
  const [name, setName] = useState(savedId?.name ?? '');
  const [idNumber, setIdNumber] = useState(savedId?.idNumber ?? '');
  const [grade, setGrade] = useState(savedId?.grade ?? '');
  const [schoolYear, setSchoolYear] = useState(savedId?.schoolYear ?? '');
  const [imageUri, setImageUri] = useState(savedId?.imageUri ?? '');
  const [scanning, setScanning] = useState(false);
  const [readingImage, setReadingImage] = useState(false);
  const [ocrError, setOcrError] = useState('');
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const pick = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { Alert.alert('Photo permission needed', 'Allow photo access to import your Student Profile screenshot.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
    if (result.canceled) return;
    const uri = result.assets[0].uri;
    setImageUri(uri);
    setOcrError('');
    setReadingImage(true);
    try {
      const lines = await extractTextFromImage(uri);
      const extractedId = findStudentId(lines);
      if (!extractedId) {
        setOcrError('No student ID number was found. Choose a clearer Infinite Campus screenshot.');
      } else {
        setIdNumber(extractedId);
        const extractedName = findLabeledValue(lines, ['name', 'student']);
        if (extractedName) setName(extractedName);
      }
    } catch (error) {
      console.warn('Unable to read the student ID screenshot.', error);
      setOcrError('The screenshot could not be read. Try a clearer image or scan the barcode.');
    } finally {
      setReadingImage(false);
    }
  };
  const save = async () => {
    if (!idNumber.trim()) { Alert.alert('Student number not found', 'Choose an Infinite Campus screenshot or scan a barcode before saving.'); return; }
    const id = { imageUri, idNumber: idNumber.trim(), name: name.trim() || 'Student', grade: grade.trim(), schoolYear: schoolYear.trim() };
    await saveSavedId(id);
    onSaved(id);
    onEditingChange(false);
    Alert.alert('Student ID saved');
  };
  if (scanning) return <View style={styles.scanner}><CameraView style={StyleSheet.absoluteFill} facing="back" barcodeScannerSettings={{ barcodeTypes: ['code39'] }} onBarcodeScanned={(event) => { setIdNumber(event.data); setScanning(false); }} /><View style={styles.scannerOverlay}><Text variant="titleMedium" style={{ color: '#fff' }}>Point at the Code 39 barcode</Text><Button mode="contained-tonal" onPress={() => setScanning(false)}>Cancel</Button></View></View>;
  if (savedId && !editing) return <ScrollView contentContainerStyle={styles.scrollContent}><Text variant="labelLarge" style={{ color: theme.colors.primary }}>Identity</Text><StudentCard theme={theme} id={savedId} /><Button mode="contained-tonal" icon="pencil-outline" style={styles.pillButton} onPress={() => onEditingChange(true)}>Edit or scan a new ID</Button></ScrollView>;
  return <ScrollView contentContainerStyle={styles.scrollContent}><Text variant="labelLarge" style={{ color: theme.colors.primary }}>Identity</Text><Text variant="headlineMedium" style={[styles.screenTitle, { color: theme.colors.onBackground }]}>{savedId ? 'Edit student ID' : 'Import your ID'}</Text><Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>Choose an Infinite Campus screenshot and the student number will be read automatically to create your barcode.</Text><Button mode="outlined" icon="image-plus" style={styles.pillButton} loading={readingImage} onPress={() => void pick()}>{readingImage ? 'Reading screenshot' : imageUri ? 'Choose a different screenshot' : 'Choose screenshot'}</Button><Button mode="text" icon="barcode-scan" onPress={() => void (cameraPermission?.granted ? setScanning(true) : requestCameraPermission())}>Scan barcode with camera</Button>{ocrError && <Text variant="bodyMedium" style={{ color: theme.colors.error, marginTop: 12 }}>{ocrError}</Text>}{idNumber && <Text variant="titleMedium" style={{ color: theme.colors.primary, marginTop: 16 }}>Student number found: {idNumber}</Text>}<TextInput mode="outlined" label="Name shown on ID (optional)" value={name} onChangeText={setName} style={styles.paperInput} /><TextInput mode="outlined" label="Grade (optional)" value={grade} onChangeText={setGrade} style={styles.paperInput} /><TextInput mode="outlined" label="School year (optional)" value={schoolYear} onChangeText={setSchoolYear} style={styles.paperInput} /><Button mode="contained" style={styles.pillButton} disabled={!idNumber || readingImage} onPress={() => void save()}>Create student barcode</Button>{savedId && <Button mode="text" textColor={theme.colors.error} onPress={() => void clearSavedId().then(() => { onSaved(null); onEditingChange(true); })}>Delete saved ID</Button>}</ScrollView>;
}

function findStudentId(lines: string[]) {
  const candidates = lines.flatMap((line) => line.match(/\b\d{5,10}\b/g) ?? []);
  const labeled = lines
    .filter((line) => /\b(student|id|number)\b/i.test(line))
    .flatMap((line) => line.match(/\b\d{5,10}\b/g) ?? []);
  return [...labeled, ...candidates].find((value) => !/^(19|20)\d{2}$/.test(value));
}

function findLabeledValue(lines: string[], labels: string[]) {
  for (const line of lines) {
    const match = line.match(new RegExp(`(?:${labels.join('|')})\\s*[:\\-]?\\s*(.+)`, 'i'));
    if (match?.[1] && !/\d{5,10}/.test(match[1])) return match[1].trim();
  }
  return '';
}

function StudentCard({ theme, id }: { theme: MD3Theme; id: SavedId }) {
  const bars = id.idNumber.split('').flatMap((character) => {
    const value = character.charCodeAt(0);
    return [1, 2, 3, 4, 5].map((bit) => ((value >> bit) & 1) === 1);
  });
  return <Card mode="contained" style={[styles.idCard, { backgroundColor: theme.colors.surfaceVariant }]}><Card.Content><Text variant="labelLarge" style={{ color: theme.colors.primary }}>Stevenson student ID</Text><Text variant="headlineSmall" style={{ color: theme.colors.onSurface, marginTop: 8 }}>{id.name}</Text><Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>ID {id.idNumber} · Grade {id.grade || '—'} · {id.schoolYear || '—'}</Text><View style={styles.barcode}><View style={styles.barcodeQuiet} />{bars.map((wide, index) => <View key={`${index}-${wide}`} style={[styles.bar, { backgroundColor: '#111318', width: wide ? 4 : 2 }]} />)}<View style={styles.barcodeQuiet} /></View></Card.Content></Card>;
}
