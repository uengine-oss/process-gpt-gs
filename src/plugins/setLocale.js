export default {
    install(app) {
      app.config.globalProperties.$setLocale = function () {
        try {
          fetch("https://ipinfo.io")
            .then((response) => response.json())
            .then((data) => {
              const country = data.country;
              if (country === "KR") {
                this.$i18n.locale = 'ko';
              } else {
                this.$i18n.locale = 'en';
              }
            });
        } catch (e) {
          this.$i18n.locale = 'ko';
        }
      };
    }
  };
  