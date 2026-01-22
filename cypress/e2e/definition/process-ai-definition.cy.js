
const email = Cypress.env('EMAIL');
const password = Cypress.env('PASSWORD');

Cypress.on('uncaught:exception', (err, runnable) => {
  return false;
});

describe('AI 프로세스 정의', () => {
  beforeEach(() => {
    cy.visit('http://127.0.0.1:5173/', {
      onBeforeLoad: (window) => {
        window.localStorage.setItem('execution', true);
      }
    });
  });

  it('passes', () => {

    cy.get('.cp-start').click();

    // Login
    cy.get('.cp-id input').clear();
    cy.get('.cp-id').type(email);
    cy.wait(1000);
    cy.get('.cp-pwd input').clear();
    cy.get('.cp-pwd').type(password);
    cy.wait(1000);
    cy.get('.cp-login').click();
    cy.wait(10000);

    // Process Menu Open
    cy.get('.cp-menu').eq(3).click();
    cy.wait(3000);

    // 프로세스 정의
    cy.get('.cp-dialog-open').click();
    cy.wait(5000);
    cy.get('.cp-chat textarea').eq(0).type('영업관리 프로세스를 다음과 같이 등록해줘: 1. 영업기회등 고객명, 예상사업규모, 키맨, 요구사항 2. 제안 작성: 제안 내용, 가격 3. 수주 혹은 실주 4. 수주한 경우, 계약진행와 같은 명령을 할 수 있습니다.', {force: true});
    cy.wait(1500);
    cy.get('.cp-send').click();

  })
})