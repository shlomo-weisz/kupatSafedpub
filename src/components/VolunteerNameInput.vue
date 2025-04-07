<!-- filepath: c:\networks\kupat\my-vue-app\src\components\VolunteerNameInput.vue -->
<template>
    <div class="volunteer-name-input">
        <label for="volunteerName">שם המתנדב:</label>
        <input
            type="text"
            id="volunteerName"
            v-model="localVolunteerName"
            @input="emitVolunteerName"
            placeholder="הכנס שם מתנדב"
        />
    </div>
</template>

<script>
export default {
    props: {
        value: {
            type: String,
            required: true,
        },
    },
    data() {
        return {
            localVolunteerName: this.value, // ערך מקומי לשם המתנדב
        };
    },
    watch: {
        // עדכון הערך המקומי אם הערך בקומפוננטת האב משתנה
        value(newValue) {
            this.localVolunteerName = newValue;
        },
    },
    methods: {
        emitVolunteerName() {
            this.$emit("update-volunteer-name", this.localVolunteerName); // שליחת הערך לקומפוננטת האב
        },
    },
};
</script>

<style scoped>
.volunteer-name-input {
  position: fixed;
  top: 10px; /* ממקם את הקומפוננטה בחלק העליון */
  left: 50%; /* ממקם את הקומפוננטה באמצע המסך */
  transform: translateX(-50%); /* ממרכז את הקומפוננטה אופקית */
  background-color: #22a9e7; /* רקע */
  border: 1px solid #ccc; /* גבול אפור עדין */
  border-radius: 8px; /* פינות מעוגלות */
  padding: 10px 20px; /* ריווח פנימי */
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); /* צל קל */
  display: flex;
  align-items: center;
  gap: 10px; /* ריווח בין התווית לשדה הקלט */
  z-index: 1000; /* מבטיח שהקומפוננטה תהיה מעל כל האלמנטים */
  direction: rtl; /* מימין לשמאל */
}

.volunteer-name-input label {
  font-weight: bold;
  color: #333; /* צבע טקסט כהה */
  font-size: 16px;
}

.volunteer-name-input input {
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
  width: 250px; /* רוחב שדה הקלט */
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1); /* צל פנימי */
}

/* רספונסיביות למסכים קטנים */
@media (max-width: 768px) {
  .volunteer-name-input {
    position: static; /* הסרת המיקום הקבוע */
    transform: none; /* ביטול ההזזה */
    width: 90%; /* התאמה לרוחב המסך */
    margin: 10px auto; /* מיקום במרכז */
    box-shadow: none; /* הסרת הצל */
    padding: 15px; /* ריווח פנימי גדול יותר */
    background-color: #f9f9f9; /* צבע רקע בהיר */
  }

  .volunteer-name-input input {
    width: 90%; /* התאמה לרוחב המסך */
    font-size: 16px; /* גודל טקסט גדול יותר */
  }

  .volunteer-name-input label {
    font-size: 14px; /* גודל טקסט קטן יותר */
  }
}
</style>