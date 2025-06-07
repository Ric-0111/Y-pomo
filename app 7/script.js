console.log('script.jsが実行開始');

// ページ読み込み後にボタンにイベントリスナーを追加
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOMが読み込まれました');
  document.getElementById('searchButton').addEventListener('click', () => searchVideos(false));
  document.getElementById('randomSearchButton').addEventListener('click', () => searchVideos(true));
  document.getElementById('playlistSearchButton').addEventListener('click', searchPlaylists);
  document.getElementById('startButton').addEventListener('click', startPomodoro);
  document.getElementById('resetButton').addEventListener('click', resetPomodoro);
  document.getElementById('nextButton').addEventListener('click', playNextVideo); // 次へボタン
  document.getElementById('prevButton').addEventListener('click', playPreviousVideo); // 前へボタン
});

let player;
let isWorkTime = true;
let timeLeft = 25 * 60; // 25分
let timerInterval;

// ★ここにあなたのYouTube APIキーを直接入力してください★
// 例: let apiKey = 'AIzaSyC_xxxxxxxxxxxxxxxxxxxxxxxxxxx';
// **警告: これは公開されるため、セキュリティリスクがあります！**
let apiKey = 'AIzaSyBkFfZSfeaCnP39CBIvthm2RhzI534wrEA'; 

let searchResults = []; // 検索結果（動画またはプレイリストの動画）を保持
let currentVideoIndex = -1; // 現在の動画のインデックス
let isPlaylistMode = false; // プレイリストモードかどうか

// APIキーをサーバーから取得する関数は不要になるので削除します
// async function loadApiKey() { /* ... */ }

// ページ読み込み時にAPIキーを取得する呼び出しも不要になります
// loadApiKey();

// YouTube IFrame APIの読み込み
function onYouTubeIframeAPIReady() {
  console.log('onYouTubeIframeAPIReadyが呼び出されました');
  player = new YT.Player('player', {
    height: '360',
    width: '640',
    playerVars: {
      'rel': 0 // 関連動画の表示をオフ
    },
    events: {
      'onReady': onPlayerReady,
      'onError': onPlayerError,
      'onStateChange': onPlayerStateChange
    }
  });
}

function onPlayerReady(event) {
  console.log('プレーヤーが準備完了しました');
}

function onPlayerError(event) {
  console.error('再生エラー:', event.data);
  alert('動画の再生に失敗しました。次の動画を試みます。');
  playNextVideo();
}

// 動画の状態変更を監視
function onPlayerStateChange(event) {
  if (event.data === YT.PlayerState.ENDED) {
    console.log('動画が終了しました。次の動画を再生します。');
    playNextVideo();
  }
}

// 次の動画を再生
function playNextVideo() {
  if (searchResults.length === 0) {
    console.log('再生可能な動画がありません');
    alert('再生可能な動画がありません。再度検索してください。');
    return;
  }

  currentVideoIndex = (currentVideoIndex + 1) % searchResults.length; // 次のインデックス（ループ）
  const nextVideo = searchResults[currentVideoIndex];
  loadVideo(nextVideo.id.videoId);
  console.log('次の動画を再生:', nextVideo.snippet.title);
}

// 前の動画を再生
function playPreviousVideo() {
  if (searchResults.length === 0) {
    console.log('再生可能な動画がありません');
    alert('再生可能な動画がありません。再度検索してください。');
    return;
  }

  currentVideoIndex = (currentVideoIndex - 1 + searchResults.length) % searchResults.length; // 前のインデックス（ループ）
  const prevVideo = searchResults[currentVideoIndex];
  loadVideo(prevVideo.id.videoId);
  console.log('前の動画を再生:', prevVideo.snippet.title);
}

// 配列をシャッフルする関数（Fisher-Yatesアルゴリズム）
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// 動画検索
async function searchVideos(isRandom) {
  console.log(isRandom ? 'ランダム動画検索が呼び出されました' : '動画検索が呼び出されました');
  if (!apiKey || apiKey === 'YOUR_YOUTUBE_API_KEY_HERE') {
    alert('APIキーが設定されていません。script.jsを確認してください。');
    return;
  }

  const query = document.getElementById('searchQuery').value;
  if (!query) {
    alert('検索キーワードを入力してください');
    return;
  }

  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=50&key=${apiKey}`;
  try {
    console.log('検索リクエスト:', url);
    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`APIエラー: ${response.status} ${response.statusText} - ${errorText}`);
    }
    const data = await response.json();
    console.log('検索結果:', data);
    if (!data.items || data.items.length === 0) {
      alert('検索結果が見つかりませんでした');
      return;
    }

    let videos = data.items;
    if (isRandom) {
      videos = shuffleArray(videos);
    }

    isPlaylistMode = false; // 動画検索モード
    searchResults = videos;
    currentVideoIndex = -1;
    document.getElementById('playlistResults').innerHTML = ''; // プレイリスト結果をクリア
    displaySearchResults(videos);
  } catch (error) {
    console.error('検索エラー:', error);
    alert(`動画の検索に失敗しました: ${error.message}`);
  }
}

// プレイリスト検索
async function searchPlaylists() {
  console.log('プレイリスト検索が呼び出されました');
  if (!apiKey || apiKey === 'YOUR_YOUTUBE_API_KEY_HERE') {
    alert('APIキーが設定されていません。script.jsを確認してください。');
    return;
  }

  const query = document.getElementById('searchQuery').value;
  if (!query) {
    alert('検索キーワードを入力してください');
    return;
  }

  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=playlist&maxResults=50&key=${apiKey}`;
  try {
    console.log('プレイリスト検索リクエスト:', url);
    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`APIエラー: ${response.status} ${response.statusText} - ${errorText}`);
    }
    const data = await response.json();
    console.log('プレイリスト検索結果:', data);
    if (!data.items || data.items.length === 0) {
      alert('プレイリストが見つかりませんでした');
      return;
    }

    displayPlaylistResults(data.items);
  } catch (error) {
    console.error('プレイリスト検索エラー:', error);
    alert(`プレイリストの検索に失敗しました: ${error.message}`);
  }
}

// プレイリスト検索結果を表示
function displayPlaylistResults(playlists) {
  const resultsDiv = document.getElementById('playlistResults');
  resultsDiv.innerHTML = ''; // 既存の結果をクリア
  document.getElementById('searchResults').innerHTML = ''; // 動画結果をクリア
  playlists.forEach(playlist => {
    const playlistDiv = document.createElement('div');
    playlistDiv.className = 'playlist-item';
    playlistDiv.innerHTML = `
      <img src="${playlist.snippet.thumbnails.medium.url}" alt="${playlist.snippet.title}">
      <p>${playlist.snippet.title}</p>
    `;
    playlistDiv.onclick = () => loadPlaylistVideos(playlist.id.playlistId);
    resultsDiv.appendChild(playlistDiv);
  });
  console.log('プレイリスト検索結果を表示しました:', playlists.length, '件');
}

// プレイリストの動画を読み込む
async function loadPlaylistVideos(playlistId) {
  if (!playlistId) {
    alert('無効なプレイリストIDです');
    return;
  }

  const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=50&key=${apiKey}`;
  try {
    console.log('プレイリスト動画リクエスト:', url);
    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`APIエラー: ${response.status} ${response.statusText} - ${errorText}`);
    }
    const data = await response.json();
    console.log('プレイリスト動画結果:', data);
    if (!data.items || data.items.length === 0) {
      alert('プレイリストに動画が見つかりませんでした');
      return;
    }

    // プレイリストの動画を検索結果として保存
    isPlaylistMode = true;
    searchResults = data.items.map(item => ({
      id: { videoId: item.snippet.resourceId.videoId },
      snippet: item.snippet
    }));
    currentVideoIndex = -1;
    document.getElementById('playlistResults').innerHTML = ''; // プレイリスト結果をクリア
    playNextVideo(); // 最初の動画を再生
  } catch (error) {
    console.error('プレイリスト動画取得エラー:', error);
    alert(`プレイリストの動画取得に失敗しました: ${error.message}`);
  }
}

// 検索結果を表示
function displaySearchResults(videos) {
  const resultsDiv = document.getElementById('searchResults');
  resultsDiv.innerHTML = ''; // 既存の結果をクリア
  videos.forEach((video, index) => {
    const videoDiv = document.createElement('div');
    videoDiv.className = 'video-item';
    videoDiv.innerHTML = `
      <img src="${video.snippet.thumbnails.medium.url}" alt="${video.snippet.title}">
      <p>${video.snippet.title}</p>
    `;
    videoDiv.onclick = () => {
      currentVideoIndex = index;
      loadVideo(video.id.videoId);
    };
    resultsDiv.appendChild(videoDiv);
  });
  console.log('検索結果を表示しました:', videos.length, '件');
}

// 動画を読み込む
async function loadVideo(videoId) {
  if (!videoId || videoId.length !== 11) {
    alert('無効な動画IDです');
    return;
  }
  player.loadVideoById(videoId);
  document.getElementById('searchResults').innerHTML = ''; // 検索結果をクリア

  // 動画タイトルを表示
  let title = '動画タイトルを読み込み中...';
  if (currentVideoIndex >= 0 && searchResults[currentVideoIndex]) {
    title = searchResults[currentVideoIndex].snippet.title;
  } else {
    try {
      const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (data.items && data.items.length > 0) {
          title = data.items[0].snippet.title;
        }
      }
    } catch (error) {
      console.error('動画タイトル取得エラー:', error);
      title = 'タイトルを取得できませんでした';
    }
  }
  document.getElementById('videoTitle').textContent = title;
  console.log('動画を読み込みました:', videoId, 'タイトル:', title);
}

// ポモドーロタイマー開始
function startPomodoro() {
  const videoId = player.getVideoData().video_id;
  if (!timerInterval && videoId) {
    timerInterval = setInterval(updateTimer, 1000);
    player.playVideo();
    console.log('ポモドーロタイマーを開始しました');
  } else if (!videoId) {
    alert('動画を選択してください');
    return;
  } else {
    alert('タイマーはすでに動作中です');
  }
}

// タイマー更新
function updateTimer() {
  timeLeft--;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  document.getElementById('timer').textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  if (timeLeft <= 0) {
    isWorkTime = !isWorkTime;
    timeLeft = isWorkTime ? 25 * 60 : 5 * 60; // 作業25分、休憩5分
    if (isWorkTime) {
      player.playVideo();
      console.log('作業時間を開始');
    } else {
      player.pauseVideo();
      console.log('休憩時間を開始');
    }
  }
}

// タイマーリセット
function resetPomodoro() {
  clearInterval(timerInterval);
  timerInterval = null;
  timeLeft = 25 * 60;
  isWorkTime = true;
  document.getElementById('timer').textContent = '25:00';
  player.pauseVideo();
  console.log('タイマーをリセットしました（動画は一時停止状態）');
}
