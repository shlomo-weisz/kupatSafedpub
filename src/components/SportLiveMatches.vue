<template>
  <div>
    <!-- מסך אימות סיסמה אם המשתמש אינו מאומת -->
    <AuthScreen 
      v-if="!isAuthenticated" 
      @auth-success="handleSuccessfulAuth"
      
    />
    
    <!-- התוכן הראשי של הקומפוננטה יוצג רק אם המשתמש מאומת -->
    <div v-else class="sport-container">
      <h1 class="title">משחקים חיים</h1>
      
      <div class="action-button-container">
        <button @click="fetchLiveMatches" class="action-button">
          <i class="fas fa-sync-alt mr-2"></i>טען משחקים חיים
        </button>
        <button @click="logout" class="action-button logout-button">
          <i class="fas fa-sign-out-alt mr-2"></i>התנתק
        </button>
      </div>

      <!-- שדה החיפוש יוצג רק אם יש תוצאות -->
      <div v-if="matches.length > 0" class="search-container">
        <div class="search-box">
          <i class="fas fa-search search-icon"></i>
          <input v-model="searchQuery" type="text" placeholder="חפש קבוצה..." class="search-input" />
        </div>
      </div>

      <!-- הודעה כשאין תוצאות חיפוש -->
      <div v-if="matches.length > 0 && filteredMatches.length === 0 && !searchQuery" class="no-results">
        <!-- הצג הודעה רק אם יש משחקים אבל החיפוש לא מצא כלום -->
        לא נמצאו תוצאות לחיפוש "{{ searchQuery }}"
      </div>

      <!-- הודעה כשאין משחקים בכלל -->
      <div v-if="matches.length === 0 && !initialLoad" class="no-matches">
        <i class="far fa-frown mb-3 text-4xl"></i>
        <p>לא נמצאו משחקים חיים כעת</p>
        <p class="text-sm">נסה שוב מאוחר יותר</p>
      </div>

      <!-- גריד המשחקים -->
      <div v-if="filteredMatches.length > 0" class="matches-grid">
        <div v-for="match in filteredMatches" :key="match.fixture.id" class="match-card"
          :class="{ 'selected': selectedMatch && selectedMatch.fixture.id === match.fixture.id }"
          @click="loadMatchDetails(match.fixture.id)"> <!-- הוספנו click על כל כרטיס -->

          <div class="match-header">
            <div class="league-info">
              <img v-if="match.league && match.league.logo" :src="match.league.logo" alt="League"
                class="league-logo">
              <span>{{ match.league ? match.league.name : 'ליגה לא ידועה' }}</span>
            </div>
            <div class="match-time">
              <i class="far fa-clock mr-1"></i>
              {{ match.fixture.status.elapsed ? match.fixture.status.elapsed + "'" : formatMatchTime(match.fixture.date) }}
              {{ match.fixture.status.long === 'Half Time' ? '(מחצית)' : '' }}
              {{ match.fixture.status.long === 'Full-Time' ? '(סיום)' : '' }}
            </div>
          </div>

          <div class="match-teams">
            <div class="team home-team">
              <img v-if="match.teams.home.logo" :src="match.teams.home.logo" alt="Home Team"
                class="team-logo">
              <span>{{ match.teams.home.name }}</span>
            </div>
            <div class="match-score">
              <span>{{ match.goals.home }}</span>
              <span> - </span>
              <span>{{ match.goals.away }}</span>
            </div>
            <div class="team away-team">
              <img v-if="match.teams.away.logo" :src="match.teams.away.logo" alt="Away Team"
                class="team-logo">
              <span>{{ match.teams.away.name }}</span>
            </div>
          </div>

          <!-- הסרנו את הכפתור - הקליק על הכרטיס כולו יטען פרטים -->
          <!-- <button class="details-button" @click.stop="loadMatchDetails(match.fixture.id)">
            פרטי משחק והרכבים
          </button> -->
        </div>
      </div>

      <!-- פרטי המשחק הנבחר - עכשיו יציג את כל המידע מהאובייקט selectedMatch -->
      <div v-if="selectedMatch" class="match-details">
        <h2 class="details-title">
          פרטי המשחק המלאים
          <!-- אפשר להוסיף כאן שם הליגה וזמן -->
          <span class="details-subtitle">
            {{ selectedMatch.league?.name || 'ליגה לא ידועה' }} -
            {{ selectedMatch.fixture?.status?.elapsed ? selectedMatch.fixture.status.elapsed + "' " + selectedMatch.fixture.status.long : formatMatchTime(selectedMatch.fixture?.date) }}
          </span>
        </h2>

        <div class="details-teams">
          <div class="team-detail">
            <img v-if="selectedMatch.teams?.home?.logo" :src="selectedMatch.teams.home.logo" alt="Home"
              class="team-detail-logo">
            <span class="team-name">{{ selectedMatch.teams?.home?.name || 'קבוצת בית לא ידועה' }}</span>
          </div>

          <div class="match-score-big">
            <span>{{ selectedMatch.goals?.home ?? '-' }}</span>
            <span> - </span>
            <span>{{ selectedMatch.goals?.away ?? '-' }}</span>
          </div>

          <div class="team-detail">
            <img v-if="selectedMatch.teams?.away?.logo" :src="selectedMatch.teams.away.logo" alt="Away"
              class="team-detail-logo">
            <span class="team-name">{{ selectedMatch.teams?.away?.name || 'קבוצת חוץ לא ידועה' }}</span>
          </div>
        </div>

        <div class="match-info">
          <div class="info-item">
            <i class="fas fa-map-marker-alt"></i>
            <span>אצטדיון: {{ selectedMatch.fixture?.venue?.name || 'לא ידוע' }}</span>
          </div>
          <!-- הצגת השופט - ודא שהנתון אכן מגיע ב-selectedMatch.fixture.referee -->
          <div class="info-item">
            <i class="fas fa-user"></i>
            <span>שופט: {{ selectedMatch.fixture?.referee || 'לא ידוע' }}</span>
          </div>
          <!-- אפשר להוסיף מידע נוסף מתוך fixture -->
          <div v-if="selectedMatch.fixture?.round" class="info-item">
            <i class="fas fa-trophy"></i>
            <span>מחזור: {{ selectedMatch.fixture.round }}</span>
          </div>
        </div>

        <!-- הרכבי הקבוצות - עכשיו משתמש ב selectedMatch.lineups -->
        <div v-if="selectedMatch.lineups && selectedMatch.lineups.length" class="lineups-container">
          <h3 class="lineups-title">הרכבי הקבוצות והמאמנים</h3>

          <div class="lineups-grid">
            <div v-for="teamLineup in selectedMatch.lineups" :key="teamLineup.team.id" class="lineup-card">
              <div class="lineup-header">
                <img v-if="teamLineup.team?.logo" :src="teamLineup.team.logo" alt="Team" class="lineup-team-logo">
                <h3>{{ teamLineup.team?.name || 'קבוצה לא ידועה' }}</h3>
                <!-- הצגת הפורמציה -->
                <span v-if="teamLineup.formation" class="formation">({{ teamLineup.formation }})</span>
              </div>

              <!-- מאמן -->
              <div v-if="teamLineup.coach" class="coach-info">
                <i class="fas fa-chalkboard-teacher mr-1"></i>
                <span>מאמן: {{ teamLineup.coach?.name || 'לא ידוע' }}</span>
                <img v-if="teamLineup.coach?.photo" :src="teamLineup.coach.photo" alt="Coach" class="coach-photo">
              </div>

              <h4>הרכב פותח</h4>
              <ul v-if="teamLineup.startXI && teamLineup.startXI.length" class="players-list">
                <li v-for="p in teamLineup.startXI" :key="p.player.id" class="player-item">
                  <span class="player-number">{{ p.player?.number ?? '-' }}</span>
                  <span class="player-name">{{ p.player?.name || 'שחקן לא ידוע' }}</span>
                  <span class="player-pos">{{ p.player?.pos || '' }}</span>
                  <!-- אופציונלי: הוספת תמונת שחקן קטנה אם זמינה בנתוני השחקנים המלאים -->
                  <!-- זה ידרוש שילוב נתונים, שכרגע לא נעשה. נשאיר פשוט -->
                  <!-- <img v-if="getPlayerPhoto(p.player.id)" :src="getPlayerPhoto(p.player.id)" class="player-photo-small"> -->
                </li>
              </ul>
              <div v-else class="no-players">ההרכב הפותח אינו זמין.</div>

              <h4>מחליפים</h4>
              <ul v-if="teamLineup.substitutes && teamLineup.substitutes.length" class="players-list substitutes-list">
                <li v-for="p in teamLineup.substitutes" :key="p.player.id" class="player-item">
                  <span class="player-number">{{ p.player?.number ?? '-' }}</span>
                  <span class="player-name">{{ p.player?.name || 'שחקן לא ידוע' }}</span>
                  <span class="player-pos">{{ p.player?.pos || '' }}</span>
                </li>
              </ul>
              <div v-else class="no-players">אין מחליפים זמינים או שהמידע לא פורסם.</div>
            </div>
          </div>
        </div>
        <div v-else class="no-data">
          <i class="fas fa-info-circle mb-2"></i>
          <p>הרכבים לא זמינים כרגע עבור משחק זה.</p>
        </div>

        <!-- סטטיסטיקות קבוצתיות - חדש -->
        <div v-if="selectedMatch.statistics && selectedMatch.statistics.length" class="statistics-container">
          <h3 class="statistics-title">סטטיסטיקות קבוצתיות</h3>
          <div class="statistics-grid">
            <div v-for="teamStats in selectedMatch.statistics" :key="teamStats.team.id" class="stats-card">
              <div class="stats-header">
                <img v-if="teamStats.team?.logo" :src="teamStats.team.logo" alt="Team" class="stats-team-logo">
                <h4>{{ teamStats.team?.name || 'קבוצה לא ידועה' }}</h4>
              </div>
              <ul class="stats-list">
                <li v-for="(stat, index) in teamStats.statistics" :key="index" class="stat-item">
                  <span class="stat-type">{{ formatStatType(stat.type) }}:</span>
                  <span class="stat-value">{{ stat.value ?? 'N/A' }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div v-else class="no-data">
          <i class="fas fa-info-circle mb-2"></i>
          <p>סטטיסטיקות קבוצתיות לא זמינות כרגע עבור משחק זה.</p>
        </div>

        <!-- פרטי שחקנים עם סטטיסטיקות אישיות - חדש (אופציונלי, מכיוון שהנתונים המלאים לכל שחקן בנפרד יכולים להיות ארוכים ומכבידים על התצוגה) -->
        <!-- חשוב להבין שהמערך `players` ב-API מכיל סטטיסטיקות *בזמן אמת* ולא בהכרח רשימת כל השחקנים בסגל -->
        <!-- הצגת רשימה זו יכולה להיות מורכבת יותר ויזואלית, אציג כאן דוגמה בסיסית מאוד -->
        <div v-if="selectedMatch.players && selectedMatch.players.length" class="players-stats-container">
          <h3 class="players-stats-title">סטטיסטיקות שחקנים (נוכחי)</h3>
          <div class="players-stats-grid">
            <div v-for="teamPlayersData in selectedMatch.players" :key="teamPlayersData.team.id" class="players-stats-card">
              <div class="players-stats-header">
                <img v-if="teamPlayersData.team?.logo" :src="teamPlayersData.team.logo" alt="Team" class="players-stats-team-logo">
                <h4>{{ teamPlayersData.team?.name || 'קבוצה לא ידועה' }}</h4>
              </div>
              <ul class="individual-players-list">
                <!-- שימו לב: player.statistics הוא מערך, לרוב עם איבר אחד עבור סטטיסטיקות המשחק הנוכחי -->
                <li v-for="pData in teamPlayersData.players" :key="pData.player.id" class="individual-player-item">
                  <img v-if="pData.player?.photo" :src="pData.player.photo" alt="Player" class="individual-player-photo">
                  <div class="individual-player-info">
                    <span class="individual-player-name">{{ pData.player?.name || 'שחקן לא ידוע' }}</span>
                    <span class="individual-player-details">
                      #{{ pData.statistics?.[0]?.games?.number ?? '-' }} |
                      {{ pData.statistics?.[0]?.games?.position || 'N/A' }} |
                      {{ pData.statistics?.[0]?.games?.minutes ?? '-' }} דק' |
                      ציון: {{ pData.statistics?.[0]?.games?.rating ?? 'N/A' }}
                    </span>
                    <!-- דוגמה לסטטיסטיקות נוסxxx -->
                    <span v-if="pData.statistics?.[0]?.goals?.total !== null" class="individual-player-details">
                      <i class="fas fa-futbol"></i> שערים: {{ pData.statistics[0].goals.total ?? 0 }}
                    </span>
                    <span v-if="pData.statistics?.[0]?.goals?.assists !== null" class="individual-player-details">
                      <i class="fas fa-handshake"></i> אסיסטים: {{ pData.statistics[0].goals.assists ?? 0 }}
                    </span>
                    <!-- אפשר להוסיף עוד סטטיסטיקות כמו בעיטות, מסירות וכו' לפי הצורך -->
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div v-else class="no-data">
          <i class="fas fa-info-circle mb-2"></i>
          <p>סטטיסטיקות שחקנים אישיות לא זמינות כרגע.</p>
        </div>

        <button class="back-button" @click="selectedMatch = null">
          חזרה לרשימת המשחקים
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import AuthScreen from './AuthScreen.vue';

export default {
  name: 'SportLiveMatches',
  components: {
    AuthScreen
  },
  data() {
    return {
      matches: [],
      searchQuery: "",
      selectedMatch: null,
      lineups: null,
      initialLoad: true,
      isAuthenticated: false,
      authToken: null,
      base_url: "https://shimushon.work/sports/",
    };
  },
  mounted() {
    // בדיקה האם קיים טוקן
    const token = localStorage.getItem('auth_token');
    if (token) {
      this.authToken = token;
      this.isAuthenticated = true;
      // טעינת משחקים לאחר אימות אוטומטי
      this.fetchLiveMatches();
    }
  },
  computed: {
    filteredMatches() {
      if (!this.searchQuery) return this.matches;
      return this.matches.filter(m =>
        m.teams.home.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        m.teams.away.name.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    }
  },
  methods: {
    // טיפול באימות מוצלח
    handleSuccessfulAuth(token) {
      this.authToken = token;
      this.isAuthenticated = true;
      // טעינת משחקים לאחר אימות
      this.fetchLiveMatches();
    },
    
    // התנתקות
    logout() {
      localStorage.removeItem('auth_token');
      this.authToken = null;
      this.isAuthenticated = false;
      this.matches = [];
      this.selectedMatch = null;
      this.lineups = null;
    },
    
    // עדכון fetchLiveMatches כדי לכלול את הטוקן
    async fetchLiveMatches() {
      try {
        this.initialLoad = false;
        const res = await fetch(`${this.base_url}live-matches`, {
          headers: {
            'Authorization': `Bearer ${this.authToken}`
          }
        });
        
        // אם יש בעיית אימות, נאלץ את המשתמש להתחבר מחדש
        if (res.status === 401) {
          this.logout();
          return;
        }
        
        console.log(res);
        
        const data = await res.json();
        this.matches = data.response || [];
        if (this.selectedMatch && this.matches.length > 0) {
          this.selectedMatch = null;
          this.lineups = null;
        }
      } catch (error) {
        console.error("שגיאה בטעינת משחקים:", error);
      }
    },
    
    // עדכון loadMatchDetails כדי לכלול את הטוקן
    async loadMatchDetails(fixtureId) {
      try {
        const matchRes = await fetch(`${this.base_url}match-details/${fixtureId}`, {
          headers: {
            'Authorization': `Bearer ${this.authToken}`
          }
        });
        
        // אם יש בעיית אימות, נאלץ את המשתמש להתחבר מחדש
        if (matchRes.status === 401) {
          this.logout();
          return;
        }
        
        const matchData = await matchRes.json();
        console.log("Match Details:", matchData.response?.[0]);
        this.selectedMatch = matchData.response?.[0];

        const lineupRes = await fetch(`${this.base_url}lineups/${fixtureId}`, {
          headers: {
            'Authorization': `Bearer ${this.authToken}`
          }
        });
        
        // אם יש בעיית אימות, נאלץ את המשתמש להתחבר מחדש
        if (lineupRes.status === 401) {
          this.logout();
          return;
        }
        
        const lineupData = await lineupRes.json();
        console.log("Lineups:", lineupData.response);

        this.lineups = lineupData.response;

        // גלילה אל פרטי המשחק
        setTimeout(() => {
          document.querySelector('.match-details')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      } catch (error) {
        console.error("שגיאה בטעינת פרטי משחק:", error);
      }
    },
    
    // שאר המתודות הקיימות
    formatMatchTime(dateString) {
      if (!dateString) return "זמן לא ידוע";
      const date = new Date(dateString);
      return date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
    },
    formatStatType(type) {
      // מילון תרגום לשמות הסטטיסטיקות
      const translations = {
        'Shots on Goal': 'בעיטות למסגרת',
        'Shots off Goal': 'בעיטות מחוץ למסגרת',
        'Total Shots': 'סה״כ בעיטות',
        'Blocked Shots': 'בעיטות חסומות',
        'Shots insidebox': 'בעיטות בתוך הרחבה',
        'Shots outsidebox': 'בעיטות מחוץ לרחבה',
        'Fouls': 'עבירות',
        'Corner Kicks': 'קרנות',
        'Offsides': 'נבדלים',
        'Ball Possession': 'אחוזי שליטה',
        'Yellow Cards': 'כרטיסים צהובים',
        'Red Cards': 'כרטיסים אדומים',
        'Goalkeeper Saves': 'הצלות שוער',
        'Total passes': 'סה״כ מסירות',
        'Passes accurate': 'מסירות מדויקות',
        'Passes %': 'אחוזי דיוק מסירות',
        // הוסף עוד תרגומים לפי הצורך
      };
      
      // החזר את השם המתורגם אם קיים, אחרת החזר את השם המקורי
      return translations[type] || type;
    }
  }
};
</script>

<style scoped>
/* הוספה של סגנון לכפתור התנתקות */
.logout-button {
  background-color: #e74c3c;
  margin-right: 10px;
}

.logout-button:hover {
  background-color: #c0392b;
}

/* Match details section - adjust if needed */
.match-details {
    margin-top: 20px;
    padding: 20px;
    background-color: #fff; /* או צבע רקע בהיר אחר */
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    direction: rtl; /* ודא כיווניות ימין לשמאל */
    text-align: right; /* ודא יישור לימין */
}

.details-title {
    text-align: center;
    color: #333; /* או צבע כהה אחר */
    margin-bottom: 20px;
    font-size: 1.6em;
    border-bottom: 2px solid #eee; /* קו הפרדה תחת הכותרת */
    padding-bottom: 10px;
}

.details-subtitle {
    display: block; /* להציג בשורה נפרדת */
    font-size: 0.9em;
    color: #666;
    margin-top: 5px;
}


.details-teams {
    display: flex;
    justify-content: space-around;
    align-items: center;
    margin-bottom: 20px;
}

.team-detail {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 30%; /* או רוחב מתאים */
}

.team-detail-logo {
    width: 50px; /* גודל לוגו גדול יותר */
    height: 50px;
    margin-bottom: 5px;
    object-fit: contain;
}

.team-name {
    font-size: 1.1em;
    font-weight: bold;
    text-align: center;
}

.match-score-big {
    font-size: 2em; /* גודל תוצאה גדול יותר */
    font-weight: bold;
    color: #007bff; /* או צבע הדגשה אחר */
}

.match-info {
    display: flex;
    justify-content: center; /* מרכז את הפריטים */
    flex-wrap: wrap; /* מאפשר מעבר שורה במסכים קטנים */
    gap: 15px; /* רווח בין הפריטים */
    margin-bottom: 30px;
    border-top: 1px dashed #eee; /* קו הפרדה עליון */
    padding-top: 15px;
}

.info-item {
    display: flex;
    align-items: center;
    color: #555;
}

.info-item i {
    margin-left: 8px; /* רווח בין אייקון לטקסט בכיווניות RTL */
    color: #007bff; /* צבע האייקונים */
}

/* Lineups section */
.lineups-container, .statistics-container, .players-stats-container {
    margin-bottom: 30px;
    padding-top: 20px;
    border-top: 2px solid #f0f0f0; /* קו הפרדה בין סקשנים */
}

.lineups-title, .statistics-title, .players-stats-title {
    font-size: 1.4em;
    color: #333;
    margin-bottom: 15px;
    text-align: right; /* יישור כותרות הסקשנים */
}

.lineups-grid, .statistics-grid, .players-stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); /* אוטומטי, מינימום 300 פיקסל רוחב לכל עמודה */
    gap: 20px; /* רווח בין הכרטיסים */
}

.lineup-card, .stats-card, .players-stats-card {
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 15px;
    background-color: #f9f9f9; /* רקע בהיר לכרטיסים */
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.lineup-header, .stats-header, .players-stats-header {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
    border-bottom: 1px solid #eee;
    padding-bottom: 8px;
}

.lineup-team-logo, .stats-team-logo, .players-stats-team-logo {
     width: 30px;
    height: 30px;
    margin-left: 10px; /* רווח אחרי הלוגו בכיווניות RTL */
    object-fit: contain;
}

.lineup-card h3, .stats-card h4, .players-stats-card h4 {
    margin: 0;
    font-size: 1.2em;
    color: #007bff; /* צבע הדגשה לשם הקבוצה */
}

.formation {
    font-size: 0.9em;
    color: #666;
    margin-right: 10px; /* רווח אחרי שם הקבוצה */
}

.coach-info {
    display: flex;
    align-items: center;
    font-size: 0.9em;
    color: #555;
    margin-bottom: 15px;
    padding-bottom: 8px;
    border-bottom: 1px dashed #eee;
}

.coach-photo {
    width: 25px;
    height: 25px;
    border-radius: 50%; /* תמונה עגולה */
    margin-right: 8px;
    object-fit: cover;
}


.players-list, .substitutes-list, .stats-list, .individual-players-list {
    list-style: none;
    padding: 0;
    margin: 0;
}

.player-item, .stat-item, .individual-player-item {
    display: flex;
    align-items: center;
    padding: 6px 0;
    border-bottom: 1px dotted #ddd;
    font-size: 0.9em;
    color: #444;
}

.player-item:last-child, .stat-item:last-child, .individual-player-item:last-child {
    border-bottom: none;
}

.player-number {
    font-weight: bold;
    width: 30px; /* רוחב קבוע למספר השחקן */
    text-align: center;
    margin-left: 10px; /* רווח אחרי המספר */
     color: #007bff; /* צבע למספר */
}

.player-name {
    flex-grow: 1; /* תופס את רוב השטח */
    font-weight: 500;
}

.player-pos {
    font-style: italic;
    color: #777;
    margin-right: 5px; /* רווח לפני העמדה */
    width: 30px; /* רוחב קבוע לעמדה */
    text-align: left;
}

.substitutes-list .player-item {
    font-size: 0.85em; /* הקטנת גודל פונט למחליפים */
    color: #666;
}

/* Statistics styles */
.stat-item {
    justify-content: space-between; /* יישור שם הסטטיסטיקה והערך לקצוות */
}

.stat-type {
    font-weight: 500;
     color: #333;
}

.stat-value {
    font-weight: bold;
    color: #007bff; /* צבע הדגשה לערך */
}

/* Individual Players Stats Styles */
.individual-player-item {
    align-items: flex-start; /* יישור למעלה בפריטים מרובי שורות */
    flex-direction: row-reverse; /* סדר: טקסט, תמונה */
}

.individual-player-photo {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    margin-right: 10px; /* רווח אחרי התמונה */
    object-fit: cover;
    flex-shrink: 0; /* מונע התכווצות התמונה */
}

.individual-player-info {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
}

.individual-player-name {
    font-weight: bold;
    font-size: 1em;
    margin-bottom: 2px;
}

.individual-player-details {
    font-size: 0.85em;
    color: #555;
    margin-bottom: 2px;
}

.individual-player-details i {
    margin-left: 5px; /* רווח בין אייקון לטקסט */
    color: #007bff;
}


/* General helpers */
.no-data, .no-players, .no-results, .no-matches {
    text-align: center;
    color: #777;
    padding: 20px;
    background-color: #f8f8f8;
    border-radius: 5px;
    margin-top: 15px;
}

.no-data i, .no-players i, .no-results i, .no-matches i {
    color: #ccc;
}


.back-button {
    display: block; /* כפתור ברוחב מלא */
    width: fit-content; /* רוחב לפי תוכן */
    margin: 30px auto 0 auto; /* ממורכז עם רווח למעלה */
    padding: 10px 20px;
    background-color: #dc3545; /* צבע אדום לכפתור חזרה */
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 1em;
    transition: background-color 0.3s ease;
}

.back-button:hover {
    background-color: #c82333;
}


/* Ensure proper RTL layout */
.sport-container {
    direction: rtl;
    text-align: right;
    /* Add any other container specific styles */
}

/* Adjustments for RTL */
.match-header {
    flex-direction: row-reverse; /* היפוך סדר רכיבים בהאדר */
}

.league-info {
     flex-direction: row-reverse; /* היפוך סדר: טקסט, לוגו */
}

.league-logo {
    margin-right: 8px; /* רווח אחרי הלוגו */
    margin-left: 0;
}

.search-box {
    flex-direction: row-reverse; /* היפוך סדר: אייקון, שדה קלט */
}

.search-icon {
    margin-left: 10px; /* רווח אחרי האייקון */
    margin-right: 0;
}

.sport-container {
	max-width: 1200px;
	margin: 0 auto;
	padding: 2rem;
	font-family: 'Heebo', 'Segoe UI', sans-serif;
	direction: rtl;
	color: #333;
}

.title {
	text-align: center;
	font-size: 2.5rem;
	font-weight: bold;
	margin-bottom: 2rem;
	color: #2c3e50;
}

.action-button-container {
	display: flex;
	justify-content: center;
	margin-bottom: 1.5rem;
}

.action-button {
	background-color: #3498db;
	color: white;
	border: none;
	padding: 0.75rem 1.5rem;
	border-radius: 8px;
	font-size: 1rem;
	cursor: pointer;
	transition: background-color 0.3s ease;
	box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	display: flex;
	align-items: center;
}

.action-button:hover {
	background-color: #2980b9;
}

.search-container {
	display: flex;
	justify-content: center;
	margin-bottom: 2rem;
}

.search-box {
	position: relative;
	width: 100%;
	max-width: 500px;
}

.search-icon {
	position: absolute;
	right: 12px;
	top: 50%;
	transform: translateY(-50%);
	color: #7f8c8d;
}

.search-input {
	width: 100%;
	padding: 0.75rem 2.5rem 0.75rem 0.75rem;
	border: 2px solid #e0e0e0;
	border-radius: 8px;
	font-size: 1rem;
	transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.search-input:focus {
	border-color: #3498db;
	outline: none;
	box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2);
}

.no-results,
.no-matches {
	text-align: center;
	padding: 3rem 0;
	color: #7f8c8d;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
}

.matches-grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
	gap: 1.5rem;
	margin-bottom: 2rem;
}

.match-card {
	background-color: #ffffff;
	border-radius: 12px;
	overflow: hidden;
	box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
	transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.match-card:hover {
	transform: translateY(-5px);
	box-shadow: 0 8px 15px rgba(0, 0, 0, 0.15);
}

.match-card.selected {
	border: 2px solid #3498db;
}

.match-header {
	background-color: #f8f9fa;
	padding: 0.75rem;
	display: flex;
	justify-content: space-between;
	align-items: center;
	border-bottom: 1px solid #e0e0e0;
}

.league-info {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-size: 0.875rem;
	color: #5a6268;
}

.league-logo {
	width: 20px;
	height: 20px;
	object-fit: contain;
}

.match-time {
	font-weight: 500;
	color: #1e88e5;
}

.match-teams {
	padding: 1rem;
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.team {
	display: flex;
	flex-direction: column;
	align-items: center;
	text-align: center;
	width: 35%;
}

.team-logo {
	width: 40px;
	height: 40px;
	object-fit: contain;
	margin-bottom: 0.5rem;
}

.match-score {
	font-size: 1.25rem;
	font-weight: bold;
	background-color: #f0f0f0;
	padding: 0.5rem 1rem;
	border-radius: 8px;
	display: flex;
	align-items: center;
}

.details-button {
	width: 100%;
	padding: 0.75rem;
	background-color: #2ecc71;
	color: white;
	border: none;
	cursor: pointer;
	font-weight: 500;
	transition: background-color 0.3s ease;
}

.details-button:hover {
	background-color: #27ae60;
}

/* עיצוב פרטי המשחק */
.match-details {
	background-color: #ffffff;
	border-radius: 12px;
	padding: 2rem;
	margin-top: 2rem;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.details-title {
	text-align: center;
	font-size: 1.5rem;
	font-weight: bold;
	margin-bottom: 1.5rem;
	color: #2c3e50;
}

.details-teams {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 2rem;
}

.team-detail {
	display: flex;
	flex-direction: column;
	align-items: center;
	width: 40%;
}

.team-detail-logo {
	width: 80px;
	height: 80px;
	object-fit: contain;
	margin-bottom: 0.75rem;
}

.team-name {
	font-weight: 600;
	font-size: 1.1rem;
	text-align: center;
}

.match-score-big {
	font-size: 2rem;
	font-weight: bold;
	background-color: #f5f5f5;
	padding: 0.75rem 1.5rem;
	border-radius: 12px;
	display: flex;
	align-items: center;
}

.match-info {
	background-color: #f8f9fa;
	border-radius: 8px;
	padding: 1rem;
	margin-bottom: 1.5rem;
}

.info-item {
	display: flex;
	align-items: center;
	margin-bottom: 0.5rem;
}

.info-item i {
	margin-left: 0.5rem;
	color: #3498db;
}

.lineups-container {
	margin-top: 1.5rem;
}

.lineups-title {
	text-align: center;
	font-size: 1.25rem;
	font-weight: bold;
	margin-bottom: 1rem;
	color: #2c3e50;
}

.lineups-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
	gap: 1.5rem;
}

.lineup-card {
	background-color: #f8f9fa;
	border-radius: 8px;
	overflow: hidden;
}

.lineup-header {
	background-color: #e9ecef;
	padding: 0.75rem;
	display: flex;
	align-items: center;
	gap: 0.75rem;
	border-bottom: 1px solid #dee2e6;
}

.lineup-team-logo {
	width: 30px;
	height: 30px;
	object-fit: contain;
}

.players-list {
	list-style: none;
	padding: 0.75rem;
}

.player-item {
	display: flex;
	align-items: center;
	padding: 0.5rem;
	border-bottom: 1px solid #e0e0e0;
}

.player-item:last-child {
	border-bottom: none;
}

.player-number {
	background-color: #3498db;
	color: white;
	width: 24px;
	height: 24px;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 0.75rem;
	margin-left: 0.75rem;
}

.player-name {
	flex-grow: 1;
}

.player-pos {
	font-size: 0.75rem;
	background-color: #e0e0e0;
	padding: 0.25rem 0.5rem;
	border-radius: 4px;
}

.back-button {
	display: block;
	margin: 1.5rem auto 0;
	background-color: #95a5a6;
	color: white;
	border: none;
	padding: 0.75rem 1.5rem;
	border-radius: 8px;
	cursor: pointer;
	transition: background-color 0.3s ease;
}

.back-button:hover {
	background-color: #7f8c8d;
}

/* רספונסיביות */
@media (max-width: 768px) {
	.sport-container {
		padding: 1rem;
	}

	.title {
		font-size: 1.75rem;
	}

	.matches-grid {
		grid-template-columns: 1fr;
	}

	.match-teams {
		flex-direction: column;
		gap: 1rem;
	}

	.team {
		width: 100%;
	}

	.details-teams {
		flex-direction: column;
		gap: 1rem;
	}

	.team-detail {
		width: 100%;
		margin-bottom: 1rem;
	}

	.match-score-big {
		margin: 1rem 0;
	}
}
</style>
