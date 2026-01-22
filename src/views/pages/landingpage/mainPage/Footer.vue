<template>
  <footer class="footer">
    <div class="container">
      <div class="footer-content">
        <div class="logo">
          <img src="@/assets/images/mainPages/uengine_logo_img.png" alt="Process GPT 로고" />
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; {{ new Date().getFullYear() }} Process GPT. All rights reserved.</p>
        <p style="margin-bottom: 20px;">uEngine has registered trademarks and uses trademarks.</p>
        <p>E-Mail: help@uengine.org</p>
      </div>
    </div>
  </footer>
</template>

<script>
export default {
  name: 'Footer'
}
</script>

<style scoped>
.footer {
  background-color: var(--bg-color-secondary);
  padding: 40px 0 30px;
  /* margin-top: 60px; */
}
/* 
 */

.footer-content {
  /* display: flex;
  justify-content: space-between;
  flex-wrap: wrap; */
  margin-bottom: 30px;
}

.logo {
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo img {
  width: auto;
  height: 40px;
  margin-right: 10px;
}

/* .footer-logo p {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--primary-color);
  margin: 0;
}

.footer-links ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
}

.footer-links ul li {
  margin-right: 20px;
  margin-bottom: 10px;
}

.footer-links ul li a {
  color: var(--text-color);
  text-decoration: none;
  transition: color 0.3s ease;
}

.footer-links ul li a:hover {
  color: var(--primary-color);
}

.footer-contact p {
  margin: 0;
  color: var(--text-color);
} */

.footer-bottom {
  /* border-top: 1px solid var(--border-color);
  padding-top: 20px; */
  text-align: center;
}

.footer-bottom p {
  margin: 0;
  color: var(--text-color-light);
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .footer-content {
    flex-direction: column;
  }
  
  .footer-logo, .footer-links, .footer-contact {
    margin-bottom: 20px;
    text-align: center;
    width: 100%;
  }
  
  .footer-logo {
    align-items: center;
  }
  
  .footer-links ul {
    justify-content: center;
  }
}
</style>
