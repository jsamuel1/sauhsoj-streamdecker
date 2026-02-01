import { Webview } from 'webview-bun';

const w = new Webview();
w.title = 'Kiro Deck';
w.size = { width: 620, height: 580, hint: 0 };
w.navigate('http://127.0.0.1:3848');
w.run();
