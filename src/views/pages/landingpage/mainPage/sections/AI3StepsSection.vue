<template>
  <section id="ai3Steps" class="ai3Steps-section">
    <div class="container mx-auto px-4">
      <h2 class="section-title font-bold text-center">{{ $t('AI3StepsSection.title1') }}</h2>
      <h2 class="section-title font-bold text-center mb-12">{{ $t('AI3StepsSection.title2') }}</h2>
        
      <div style="max-width: 1000px; margin: 0 auto;">
        <table class="tbl-default display-pc">
          <tr class="border-bottom-n">
            <th class="tbl-title-md-gray" style="width: 15%;">{{ $t('AI3StepsSection.category') }}</th>
            <th class="tbl-title-md-gray" style="width: 22%;">{{ $t('AI3StepsSection.step1') }}</th>
            <th class="tbl-title-md-gray" style="width: 23%;">{{ $t('AI3StepsSection.step2') }}</th>
            <th class="tbl-title-md-gray" style="width: 30%;">{{ $t('AI3StepsSection.step3') }}</th>
          </tr>
          <tr>
            <td class="border-left-n" style="font-weight: 600;">{{ $t('AI3StepsSection.role') }}</td>
            <td v-html="$t('AI3StepsSection.role1')"></td>
            <td v-html="$t('AI3StepsSection.role2')"></td>
            <td v-html="$t('AI3StepsSection.role3')"></td>
          </tr>
          <tr>
            <td class="border-left-n" style="font-weight: 600;">{{ $t('AI3StepsSection.scenario') }}</td>
            <td>{{ $t('AI3StepsSection.scenario1') }}</td>
            <td>{{ $t('AI3StepsSection.scenario2') }}</td>
            <td>{{ $t('AI3StepsSection.scenario3') }}</td>
          </tr>
          <tr>
            <td class="border-left-n" style="font-weight: 600;">{{ $t('AI3StepsSection.change') }}</td>
            <td v-html="$t('AI3StepsSection.change1')"></td>
            <td v-html="$t('AI3StepsSection.change2')"></td>
            <td v-html="$t('AI3StepsSection.change3')"></td>
          </tr>
          <tr>
            <td class="border-left-n" style="font-weight: 600;">{{ $t('AI3StepsSection.behavior') }}</td>
            <td v-html="$t('AI3StepsSection.behavior1')"></td>
            <td v-html="$t('AI3StepsSection.behavior2')"></td>
            <td v-html="$t('AI3StepsSection.behavior3')"></td>
          </tr>
          <tr>
            <td class="border-left-n" style="font-weight: 600;">{{ $t('AI3StepsSection.technology') }}</td>
            <td v-html="$t('AI3StepsSection.technology1')"></td>
            <td v-html="$t('AI3StepsSection.technology2')"></td>
            <td v-html="$t('AI3StepsSection.technology3')"></td>
          </tr>
          <tr>
            <td class="border-left-n" style="font-weight: 600;">{{ $t('AI3StepsSection.platform') }}</td>
            <td>MS Copilot 365<br>Google Duet AI</td>
            <td>Google AgentSpace<br>IBM Orchestrate</td>
            <td><b>Process GPT</b>, Palantir AIP<br>SAP AI, Custom AI Orchestration</td>
          </tr>
        </table>

        <table class="tbl-default display-mobile">
          <tr class="border-bottom-n">
            <!-- <th class="tbl-title-md-gray" style="width: 15%;">{{ $t('AI3StepsSection.category') }}</th> -->
            <th class="tbl-title-md-gray">{{ $t('AI3StepsSection.step1') }}</th>
            <th class="tbl-title-md-gray">{{ $t('AI3StepsSection.step2') }}</th>
            <th class="tbl-title-md-gray">{{ $t('AI3StepsSection.step3') }}</th>
          </tr>
          <tr>
            <td colspan="3" class="border-left-n text-center" style="font-weight: 600;">{{ $t('AI3StepsSection.role') }}</td>
          </tr>
          <tr>
            <td class="border-left-n" v-html="$t('AI3StepsSection.role1')"></td>
            <td v-html="$t('AI3StepsSection.role2')"></td>
            <td v-html="$t('AI3StepsSection.role3')"></td>
          </tr>
          <tr>
            <td colspan="3" class="border-left-n text-center" style="font-weight: 600;">{{ $t('AI3StepsSection.scenario') }}</td>
          </tr>
          <tr>
            <td class="border-left-n">{{ $t('AI3StepsSection.scenario1') }}</td>
            <td>{{ $t('AI3StepsSection.scenario2') }}</td>
            <td>{{ $t('AI3StepsSection.scenario3') }}</td>
          </tr>
          <tr>
            <td colspan="3" class="border-left-n text-center" style="font-weight: 600;">{{ $t('AI3StepsSection.change') }}</td>
          </tr>
          <tr>
            <td class="border-left-n" v-html="$t('AI3StepsSection.change1')"></td>
            <td v-html="$t('AI3StepsSection.change2')"></td>
            <td v-html="$t('AI3StepsSection.change3')"></td>
          </tr>
          <tr>
            <td colspan="3" class="border-left-n text-center" style="font-weight: 600;">{{ $t('AI3StepsSection.behavior') }}</td>
          </tr>
          <tr>
            <td class="border-left-n" v-html="$t('AI3StepsSection.behavior1')"></td>
            <td v-html="$t('AI3StepsSection.behavior2')"></td>
            <td v-html="$t('AI3StepsSection.behavior3')"></td>
          </tr>
          <tr>
            <td colspan="3" class="border-left-n text-center" style="font-weight: 600;">{{ $t('AI3StepsSection.technology') }}</td>
          </tr>
          <tr>
            <td class="border-left-n" v-html="$t('AI3StepsSection.technology1')"></td>
            <td v-html="$t('AI3StepsSection.technology2')"></td>
            <td v-html="$t('AI3StepsSection.technology3')"></td>
          </tr>
          <tr>
            <td colspan="3" class="border-left-n text-center" style="font-weight: 600;">{{ $t('AI3StepsSection.platform') }}</td>
          </tr>
          <tr>
            <td class="border-left-n">MS Copilot 365<br>Google Duet AI</td>
            <td>Google AgentSpace<br>IBM Orchestrate</td>
            <td><b>Process GPT</b>, Palantir AIP<br>SAP AI, Custom AI Orchestration</td>
          </tr>
        </table>
      </div>

      <div class="text-center mb-8">
        <p class="description-title mb-3">{{ $t('AI3StepsSection.description1') }}</p>
        <p class="description-title">{{ $t('AI3StepsSection.description2') }}</p>
      </div>
  </div>
  </section>
</template>

<script>
export default {
  name: 'AI3StepsSection'
}
</script>

<style scoped>
.ai3Steps-section {
  padding: 80px 0 60px;
  background-color: var(--light-color);
}

.section-title {
    font-size: 48px;
    line-height: 1.3;
}

/* ==============================
   table style
   ============================== */
.display-pc {
  display: block;
}

.display-mobile {
  display: none;
}

.tbl-default {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 40px;
    font-size: 16px;
    line-height: 1.5;
}

.tbl-default tr {
    border-bottom: 1px solid #aaa;
}

.tbl-default tr:not(:first-child) {
    background-color: #ffffff;
}

.tbl-default td {
    border-left: 1px solid #aaa;
    padding: 5px;
    padding-left: 10px;
}

.tbl-title-md-gray {
    color: #fff;
    background-color: #6b757d ;
    font-weight: 600;
    border: 2px solid var(--light-color);
    border-radius: 7px;
    padding: 10px 5px;
}

.border-bottom-n {
    border-bottom: none !important;
}

.border-left-n {
    border-left: none !important;
}

.description-title {
    font-size: 20px; 
    font-weight: 600; 
    line-height: 1.5; 
}

@media (max-width: 768px) {
  .display-pc {
    display: none;
  }

  .display-mobile {
    display: block;
  }

  .ai3Steps-section {
    padding: 60px 0 40px;
  }

  .section-title {
      font-size: 32px;
  }

  .tbl-default td {
    padding-left: 5px;
  }

  .description-title {
    font-size: 18px;
  }
}

@media (max-width: 576px) {
  .section-title {
      font-size: 28px;
  }
}
</style>
