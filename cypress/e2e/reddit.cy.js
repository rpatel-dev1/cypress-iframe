function getStripeField({iframeSelector, fieldSelector}, attempts = 0) {
  Cypress.log({displayName: 'getCardField', message: `${fieldSelector}: ${attempts}`})

  if (attempts > 50) throw new Error('too many attempts')

  return cy.get(iframeSelector, {timeout:10_000, log:false})
    .eq(0, {log:false})
    .its('0.contentDocument', {log:false}) 
    .find('body', {log:false})
    .then(body => {
      const stripeField = body.find(fieldSelector)
      if (!stripeField.length) {
        return cy.wait(300, {log:false})
          .then(() => {
            getStripeField({iframeSelector, fieldSelector}, ++attempts)
          })
      } else {
        return cy.wrap(stripeField)
      }
    })
}

const IFRAME_SELECTOR = 'iframe[title="Secure payment input frame"]'

it('gets the post', () => {
  cy.intercept('https://merchant-ui-api.stripe.com/elements/wallet-config').as('iframeLoaded')
  cy.visit('https://store.pysaas.io/')
  cy.get('#products a').contains('PySaaS - Pure Python Micro-SaaS Kit').click()
  const formParent = cy.get('.px-0')
  formParent.contains('.button-toggle label', 'Pay by Card').click()
  cy.wait('@iframeLoaded')
  getStripeField({
    iframeSelector: IFRAME_SELECTOR, 
    fieldSelector: '#card-tab'
  }).click()
  getStripeField({
    iframeSelector: IFRAME_SELECTOR, 
    fieldSelector: '#Field-numberInput'
  }).type('1234123412341234')
  getStripeField({
    iframeSelector: IFRAME_SELECTOR, 
    fieldSelector: '#Field-expiryInput'
  }).type('01/26')
  getStripeField({
    iframeSelector: IFRAME_SELECTOR, 
    fieldSelector: '#Field-cvcInput'
  }).type('111')
  const form = formParent.get('form')
  form.get('#email').type('reddit@reddit.com')
  form.get('#name').type('Reddit User')
  form.get('#country').select('US')
  form.get('#postal_code').type('90210')
  form.get('input[dusk="checkout-form-tax-number"]').type('TAXID')
  form.get('#discount_code').type('DISCOUNTCODE')
  form.get('button[dusk="checkout-form-submit"]').click()
})