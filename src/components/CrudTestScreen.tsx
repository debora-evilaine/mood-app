import React, { useEffect, useState } from 'react';
import { View, Text, Button, ScrollView, StyleSheet } from 'react-native';
import { databaseService } from '../services/database.services';

export function CrudTestScreen({ onBack }: { onBack: () => void }) {
	const [logs, setLogs] = useState<string[]>([]);
	const [lastEntry, setLastEntry] = useState<any | null>(null);

	function log(msg: string) {
		setLogs((s) => [new Date().toISOString() + ' — ' + msg, ...s].slice(0, 100));
	}

	useEffect(() => {
		(async () => {
			try {
				await databaseService.init();
				log('DB initialized');
			} catch (e) {
				log('DB init error: ' + (e instanceof Error ? e.message : String(e)));
			}
		})();
	}, []);

	async function createEntry() {
		try {
			const entry = await databaseService.createMoodEntry({ date: new Date().toISOString().split('T')[0], humores: ['Feliz'], tags: [], notes: 'Teste', intensity: 3 });
			log('Created entry: ' + JSON.stringify(entry));
			setLastEntry(entry);
		} catch (e) {
			log('Create error: ' + (e instanceof Error ? e.message : String(e)));
		}
	}

	async function listEntries() {
		try {
			const rows = await databaseService.getAllMoodEntries();
			log('Entries: ' + JSON.stringify(rows));
			setLastEntry(rows[0] || null);
		} catch (e) {
			log('List error: ' + (e instanceof Error ? e.message : String(e)));
		}
	}

	async function deleteAll() {
		try {
			const res = await databaseService.deleteAllMoodEntries();
			log('Deleted all entries: ' + res);
			setLastEntry(null);
		} catch (e) {
			log('Delete all error: ' + (e instanceof Error ? e.message : String(e)));
		}

	}

			// Helper functions now in top-level scope (available for button onPress)
			async function getFirstEntryTop() {
				try {
					if (!lastEntry?.id) {
						log('No known lastEntry id; listing entries to get first');
						const rows = await databaseService.getAllMoodEntries();
						const first = rows[0] || null;
						setLastEntry(first);
						log('First entry: ' + JSON.stringify(first));
						return;
					}
					const first = await databaseService.getMoodEntryById(lastEntry.id);
					setLastEntry(first);
					log('First entry by id: ' + JSON.stringify(first));
				} catch (e) {
					log('getFirstEntry error: ' + (e instanceof Error ? e.message : String(e)));
				}
			}

			async function getByDateTop() {
				try {
					const date = new Date().toISOString().split('T')[0];
					const rows = await databaseService.getMoodEntriesByDate(date);
					setLastEntry(rows[0] || null);
					log('Entries for ' + date + ': ' + JSON.stringify(rows));
				} catch (e) {
					log('getByDate error: ' + (e instanceof Error ? e.message : String(e)));
				}
			}

			async function updateLastEntryTop() {
				try {
					if (!lastEntry?.id) {
						log('No last entry to update');
						return;
					}
					const ok = await databaseService.updateMoodEntry(lastEntry.id, { mood: (lastEntry.mood || 'Feliz') + ' (upd)' });
					log('Update result: ' + ok);
					const updated = await databaseService.getMoodEntryById(lastEntry.id);
					setLastEntry(updated);
					log('Updated entry: ' + JSON.stringify(updated));
				} catch (e) {
					log('updateLastEntry error: ' + (e instanceof Error ? e.message : String(e)));
				}
			}

			async function showStatsTop() {
				try {
					const stats = await databaseService.getMoodStats();
					log('Stats: ' + JSON.stringify(stats));
				} catch (e) {
					log('stats error: ' + (e instanceof Error ? e.message : String(e)));
				}
			}

	return (
		<ScrollView contentContainerStyle={styles.container}>
			<Text style={styles.title}>CRUD Test Screen</Text>
			<View style={styles.buttonRow}>
				<Button title="Create entry" onPress={createEntry} />
				<Button title="List entries" onPress={listEntries} />
				<Button title="Delete all" onPress={deleteAll} />
			</View>
			<View style={[styles.buttonRow, { marginTop: 8 }] }>
				<Button title="Get first" onPress={getFirstEntryTop} />
				<Button title="Get by date" onPress={getByDateTop} />
				<Button title="Update last" onPress={updateLastEntryTop} />
			</View>
			<View style={[styles.buttonRow, { marginTop: 8 }] }>
				<Button title="Stats" onPress={showStatsTop} />
			</View>
			<View style={{ marginTop: 12 }}>
				<Button title="Back" onPress={onBack} />
			</View>

			<View style={{ marginTop: 16 }}>
				<Text style={{ fontWeight: 'bold' }}>Logs</Text>
				{logs.map((l, i) => (
					<Text key={i} style={styles.log}>{l}</Text>
				))}
			</View>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: { padding: 16 },
	title: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
	buttonRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
	log: { fontSize: 12, marginTop: 4 },
});
