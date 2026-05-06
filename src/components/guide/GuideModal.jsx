import React from 'react';

export default function GuideModal({ onClose }) {
  return (
    <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
      <div className="modal-content" style={{ backgroundColor: '#1e1e2f', color: '#fff', padding: '30px', borderRadius: '12px', width: '90%', maxWidth: '650px', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #444', paddingBottom: '15px', marginBottom: '25px' }}>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>📖</span> バッジかんり アプリの使い方ガイド
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#aaa', fontSize: '1.8rem', cursor: 'pointer', transition: 'color 0.2s' }} onMouseOver={(e) => e.target.style.color = '#fff'} onMouseOut={(e) => e.target.style.color = '#aaa'}>
            ×
          </button>
        </div>

        <div style={{ lineHeight: '1.7', fontSize: '15px' }}>
          <p style={{ marginBottom: '30px', color: '#ccc' }}>
            このアプリは、リスナーさんへの称号（バッジ）付与と、それに伴う特典の渡し忘れを防ぐための管理ツールです。上部のナビゲーションタブごとに以下の操作が可能です。
          </p>

          {/* 📊 ダッシュボード */}
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ color: '#4da6ff', borderLeft: '4px solid #4da6ff', paddingLeft: '12px', margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              📊 ダッシュボード（メイン画面）
            </h3>
            <ul style={{ paddingLeft: '20px', margin: 0, color: '#e0e0e0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li><b>期間の管理：</b> 左側の「+ 新しい期間」から今月用のデータ枠を作成・切り替えできます。</li>
              <li><b>称号の付与：</b> リスナー名を入力し、称号を選んで「付与」を押すと記録されます。</li>
              <li><b>未渡し特典の確認（繰り越し）：</b> 称号に紐づく特典のうち、「未渡し」のものが上部のバナーに自動でリストアップされます。月をまたいでも自動で繰り越されるため、渡し忘れを防げます（※当月限定の特典を除く）。特典を渡したら「✅ 完了」を押しましょう。</li>
              <li><b>データ出力：</b> 称号付与一覧の「エクスポート」から、データをCSV形式でダウンロードできます。</li>
            </ul>
          </div>

          {/* 🏅 称号管理 */}
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ color: '#ffb347', borderLeft: '4px solid #ffb347', paddingLeft: '12px', margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🏅 称号管理（マスター設定）
            </h3>
            <p style={{ margin: '0 0 10px 0', color: '#ccc' }}>アプリ内で使用する「称号（バッジ）」の大元となるデータを作成する場所です。</p>
            <ul style={{ paddingLeft: '20px', margin: 0, color: '#e0e0e0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li>星1〜星5など、配信枠で実際に使用している称号の名前を登録します。</li>
              <li><b>ランク（順番）の設定：</b> 上位の称号を設定しておくことで、後述の「特典」を自動でまとめて付与する連携が可能になります。</li>
            </ul>
          </div>

          {/* 🎁 特典管理 */}
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ color: '#ff6666', borderLeft: '4px solid #ff6666', paddingLeft: '12px', margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🎁 特典管理（マスター設定）
            </h3>
            <p style={{ margin: '0 0 10px 0', color: '#ccc' }}>各称号を獲得したリスナーさんにプレゼントする「特典（イラストやボイスなど）」を設定します。</p>
            <ul style={{ paddingLeft: '20px', margin: 0, color: '#e0e0e0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li><b>称号との紐付け：</b> 「この特典はどの称号の獲得条件か」をセットします。上位称号を付与した際、下位の特典も自動的にリストアップされます。</li>
              <li><b>期限のタイプ設定：</b> 特典ごとに「今月限りで消滅するもの」か「渡し終わるまで翌月以降も繰り越すもの」かを設定できます。</li>
            </ul>
          </div>

          {/* 📝 マイアクティビティ */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ color: '#66ffb3', borderLeft: '4px solid #66ffb3', paddingLeft: '12px', margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              📝 自分の記録（マイアクティビティ）
            </h3>
            <ul style={{ paddingLeft: '20px', margin: 0, color: '#e0e0e0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li>ライバー活動における自身の記録やメモ、配信の振り返りなどを残しておくことができるパーソナルスペースです。日々の目標管理などにご活用ください。</li>
            </ul>
          </div>

        </div>

        <div style={{ textAlign: 'center', marginTop: '35px', paddingTop: '20px', borderTop: '1px solid #444' }}>
          <button 
            onClick={onClose} 
            style={{ padding: '12px 35px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', transition: 'background-color 0.2s' }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#0056b3'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#007bff'}
          >
            ガイドを閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
