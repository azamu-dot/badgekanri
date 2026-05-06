import React from 'react';

export default function GuideModal({ onClose }) {
  return (
    <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
      <div className="modal-content" style={{ backgroundColor: '#1e1e2f', color: '#fff', padding: '30px', borderRadius: '12px', width: '90%', maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333', paddingBottom: '10px', marginBottom: '20px' }}>
          <h2 style={{ margin: 0 }}>📖 アプリの使い方ガイド</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
        </div>

        <div style={{ lineHeight: '1.8' }}>
          <h3 style={{ color: '#4da6ff', borderLeft: '4px solid #4da6ff', paddingLeft: '10px' }}>1. 集計期間の作成と切り替え</h3>
          <p>
            画面左側の「+ 新しい期間」ボタンから、今月用の集計期間を作成します。<br/>
            作成した期間をクリックすると「表示中」となり、その月のデータのみを管理・閲覧できるようになります。
          </p>

          <h3 style={{ color: '#4da6ff', borderLeft: '4px solid #4da6ff', paddingLeft: '10px' }}>2. リスナーへの称号付与</h3>
          <p>
            ダッシュボードの「リスナーに称号を付与」エリアから操作します。名前を入力し、称号の種類を選んで「付与」ボタンを押すだけで、リストに反映されます。
          </p>

          <h3 style={{ color: '#ffb347', borderLeft: '4px solid #ffb347', paddingLeft: '10px' }}>3. 特典の「繰り越し」と「完了」</h3>
          <p>
            称号に紐づく特典のうち、<b>「未渡し」のものは自動的にダッシュボードのバナーにリストアップ</b>されます。<br/>
            月をまたいでも、その月限りの特典以外は自動で「繰り越し」表示されます。特典を渡したら、横の<b>「✅ 完了」</b>ボタンを押してリストから消去しましょう。
          </p>

          <h3 style={{ color: '#4da6ff', borderLeft: '4px solid #4da6ff', paddingLeft: '10px' }}>4. CSVエクスポート機能</h3>
          <p>
            「称号付与一覧」の右上にある「エクスポート」ボタンを押すと、表示中のデータがExcel等で読み込めるCSV形式でダウンロードできます。配信の記録やリスナーの管理にご活用ください。
          </p>
        </div>

        <div style={{ textAlign: 'center', marginTop: '30px' }}>
          <button onClick={onClose} className="btn btn-secondary" style={{ padding: '10px 30px', cursor: 'pointer', borderRadius: '6px' }}>ガイドを閉じる</button>
        </div>
      </div>
    </div>
  );
}
