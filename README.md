# Flavy Cloud Functions (Mega Hack Shawee)

Funções chamadas pelo front end que se comunicam com Firebse e Stripe

Landing page do pojeto: https://flavyapp.now.sh

Webapp desenvolvida no Hackaton da Shawee

Flavy é uma webapp que visa trazer mais rapidez na hora de ordenar e pagar por comida e bebida em restaurantes e bares.

Com Flavy os clientes navegam pelo menu diretamente pelo smartphone, fazem o pedido sem tempo de espera e pagam rapidamente, sem precisar fazer o download de nenhum aplicativo.

#### Esse é o app responsavel pelo gerenciamente lado restaurante

![alt text](https://firebasestorage.googleapis.com/v0/b/flavy-app.appspot.com/o/Screenshot%202020-07-05%20at%2015.39.34.png?alt=media&token=5ff735b8-b55c-498a-b195-080757abf409)

![alt text](https://firebasestorage.googleapis.com/v0/b/flavy-app.appspot.com/o/Screenshot%202020-07-05%20at%2015.42.48.png?alt=media&token=f8de99d3-9964-497b-b809-d6b964dd0b5f)


## Implementaçāo
O front end, desenvolvido em Vue.js, se comunica com o backend, Firestore, atraves de Funções na nuvem.
O passos sāo:
1. Front end requisita os dados do estabelecimento atraves de uma chamada a uma Cloud Function passando o email do usuario.
2. Essas funções se comunicam com o database e retornam os dados do estabelecimento desejado (atraves do email do administrador).
3. Quando o cliente efetua o pagamento na webapp, criamos um objeto desse pagamento no database contendo um TOken gerado pela API do Stripe.
4. Na webapp de administracao do restaurante, a ordem chega em tempo real, quando o atendente aceita a ordem, re-enviamos o Token para a API do Stripe, que por sua vez concretiza o pagamento.
Nenhum dado é tratado no front end, tudo é feito pelas Cloud Functions, diminuindo os riscos de roubo de informações confidenciais.
![alt text](https://firebasestorage.googleapis.com/v0/b/flavy-app.appspot.com/o/Screenshot%202020-07-05%20at%2016.52.04.png?alt=media&token=2456ed58-00ac-4bdf-941a-14b9977c2c93)
