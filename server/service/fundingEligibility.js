/* @flow */

import { COUNTRY, CURRENCY, INTENT, COMMIT, VAULT, CARD, FUNDING } from '@paypal/sdk-constants';
import { params, types, query } from 'typed-graphqlify';
import { values } from 'belter';
import { strictMerge } from 'strict-merge';

import { isDefined, type GraphQLBatch } from '../lib';
import type { ExpressRequest, LoggerType } from '../types';

export type FundingEligibility = {|
    paypal : {
        eligible : boolean,
        vaultable : boolean,
        vaultedInstruments : {
            id : string,
            label : {
                description : string
            }
        }
    },
    venmo : {
        eligible : boolean,
        vaultable : boolean
    },
    itau : {
        eligible : boolean,
        vaultable : boolean
    },
    credit : {
        eligible : boolean,
        vaultable : boolean
    },
    sepa : {
        eligible : boolean,
        vaultable : boolean
    },
    ideal : {
        eligible : boolean,
        vaultable : boolean
    },
    bancontact : {
        eligible : boolean,
        vaultable : boolean
    },
    giropay : {
        eligible : boolean,
        vaultable : boolean
    },
    eps : {
        eligible : boolean,
        vaultable : boolean
    },
    sofort : {
        eligible : boolean,
        vaultable : boolean
    },
    mybank : {
        eligible : boolean,
        vaultable : boolean
    },
    p24 : {
        eligible : boolean,
        vaultable : boolean
    },
    zimpler : {
        eligible : boolean,
        vaultable : boolean
    },
    wechatpay : {
        eligible : boolean,
        vaultable : boolean
    },
    payu : {
        eligible : boolean,
        vaultable : boolean
    },
    trustly : {
        eligible : boolean,
        vaultable : boolean
    },
    blik : {
        eligible : boolean,
        vaultable : boolean
    },
    oxxo : {
        eligible : boolean,
        vaultable : boolean
    },
    maxima : {
        eligible : boolean,
        vaultable : boolean
    },
    boleto : {
        eligible : boolean,
        vaultable : boolean
    },
    card : {
        eligible : boolean,
        branded : boolean,
        vendors : {
            visa : {
                eligible : boolean,
                vaultable : boolean,
                vaultedInstruments : {
                    id : string,
                    label : {
                        description : string
                    }
                }
            },
            mastercard : {
                eligible : boolean,
                vaultable : boolean,
                vaultedInstruments : {
                    id : string,
                    label : {
                        description : string
                    }
                }
            },
            amex : {
                eligible : boolean,
                vaultable : boolean,
                vaultedInstruments : {
                    id : string,
                    label : {
                        description : string
                    }
                }
            },
            discover : {
                eligible : boolean,
                vaultable : boolean,
                vaultedInstruments : {
                    id : string,
                    label : {
                        description : string
                    }
                }
            },
            hiper : {
                eligible : boolean,
                vaultable : boolean,
                vaultedInstruments : {
                    id : string,
                    label : {
                        description : string
                    }
                }
            },
            elo : {
                eligible : boolean,
                vaultable : boolean,
                vaultedInstruments : {
                    id : string,
                    label : {
                        description : string
                    }
                }
            },
            jcb : {
                eligible : boolean,
                vaultable : boolean,
                vaultedInstruments : {
                    id : string,
                    label : {
                        description : string
                    }
                }
            }
        }
    }
|};

function buildFundingEligibilityQuery(basicFundingEligibility : FundingEligibility) : string {
    const InputTypes = {
        $clientID:        'String',
        $buyerCountry:    'CountryCodes',
        $ip:              'String',
        $cookies:         'String',
        $currency:        'SupportedCountryCurrencies',
        $intent:          'FundingEligibilityIntent',
        $commit:          'Boolean',
        $vault:           'Boolean',
        $disableFunding:  '[ SupportedPaymentMethodsType ]',
        $disableCard:     '[ SupportedCardsType ]',
        $merchantID:      '[ String ]',
        $buttonSessionID: 'String',
        $userAgent:       'String'
    };

    const Inputs = {
        clientId:        '$clientID',
        buyerCountry:    '$buyerCountry',
        ip:              '$ip',
        cookies:         '$cookies',
        currency:        '$currency',
        intent:          '$intent',
        commit:          '$commit',
        vault:           '$vault',
        disableFunding:  '$disableFunding',
        disableCard:     '$disableCard',
        merchantId:      '$merchantID',
        buttonSessionId: '$buttonSessionID',
        userAgent:       '$userAgent'
    };

    const getVaultedInstrumentQuery = () => {
        return {
            id:    types.string,
            label: {
                description: types.string
            }
        };
    };

    const getBasicFundingEligibilityQuery = () => {
        return {
            eligible: types.boolean
        };
    };

    const getBasicCardVendorQuery = () => {
        return {
            eligible:           types.boolean,
            vaultable:          types.boolean,
            vaultedInstruments: getVaultedInstrumentQuery()
        };
    };

    const getVendorQuery = () => {
        return {
            [CARD.VISA]:       getBasicCardVendorQuery(),
            [CARD.MASTERCARD]: getBasicCardVendorQuery(),
            [CARD.AMEX]:       getBasicCardVendorQuery(),
            [CARD.DISCOVER]:   getBasicCardVendorQuery(),
            [CARD.HIPER]:      getBasicCardVendorQuery(),
            [CARD.ELO]:        getBasicCardVendorQuery(),
            [CARD.JCB]:        getBasicCardVendorQuery()
        };
    };

    const getPayPalQuery = () => {
        return {
            eligible:           types.boolean,
            vaultable:          types.boolean,
            vaultedInstruments: getVaultedInstrumentQuery()
        };
    };

    const getCardQuery = () => {
        return {
            eligible: types.boolean,
            branded:  types.boolean,
            vendors:  getVendorQuery()
        };
    };

    const fundingQuery = {
        [ FUNDING.PAYPAL ]:     getPayPalQuery(),
        [ FUNDING.CARD ]:       getCardQuery(),
        [ FUNDING.VENMO ]:      getBasicFundingEligibilityQuery(),
        [ FUNDING.ITAU ]:       getBasicFundingEligibilityQuery(),
        [ FUNDING.CREDIT ]:     getBasicFundingEligibilityQuery(),
        [ FUNDING.SEPA ]:       getBasicFundingEligibilityQuery(),
        [ FUNDING.IDEAL ]:      getBasicFundingEligibilityQuery(),
        [ FUNDING.BANCONTACT ]: getBasicFundingEligibilityQuery(),
        [ FUNDING.GIROPAY ]:    getBasicFundingEligibilityQuery(),
        [ FUNDING.EPS ]:        getBasicFundingEligibilityQuery(),
        [ FUNDING.SOFORT ]:     getBasicFundingEligibilityQuery(),
        [ FUNDING.MYBANK ]:     getBasicFundingEligibilityQuery(),
        [ FUNDING.P24 ]:        getBasicFundingEligibilityQuery(),
        [ FUNDING.ZIMPLER ]:    getBasicFundingEligibilityQuery(),
        [ FUNDING.WECHATPAY ]:  getBasicFundingEligibilityQuery(),
        [ FUNDING.PAYU ]:       getBasicFundingEligibilityQuery(),
        [ FUNDING.BLIK ]:       getBasicFundingEligibilityQuery(),
        [ FUNDING.TRUSTLY ]:    getBasicFundingEligibilityQuery(),
        [ FUNDING.OXXO ]:       getBasicFundingEligibilityQuery(),
        [ FUNDING.MAXIMA ]:     getBasicFundingEligibilityQuery(),
        [ FUNDING.BOLETO ]:     getBasicFundingEligibilityQuery()
    };

    const basicCardEligibility = basicFundingEligibility[FUNDING.CARD] && basicFundingEligibility[FUNDING.CARD].vendors;
    const vendorsQuery = fundingQuery[FUNDING.CARD].vendors;

    for (const card of values(CARD)) {
        if (basicCardEligibility && basicCardEligibility[card] && vendorsQuery[card]) {
            if (isDefined(basicCardEligibility[card].eligible)) {
                delete vendorsQuery[card].eligible;
            }

            if (isDefined(basicCardEligibility[card].vaultable)) {
                delete vendorsQuery[card].vaultable;
            }

            if (!Object.keys(vendorsQuery[card]).length) {
                delete vendorsQuery[card];
            }
        }
    }

    if (!Object.keys(vendorsQuery).length) {
        delete fundingQuery[FUNDING.CARD].vendors;
    }

    for (const fundingSource of values(FUNDING)) {
        if ([ FUNDING.VENMO, FUNDING.ITAU ].includes(fundingSource)) {
            continue;
        }

        if (basicFundingEligibility[fundingSource] && fundingQuery[fundingSource]) {
            if (isDefined(basicFundingEligibility[fundingSource].eligible)) {
                delete fundingQuery[fundingSource].eligible;
            }

            if (isDefined(basicFundingEligibility[fundingSource].vaultable)) {
                delete fundingQuery[fundingSource].vaultable;
            }

            if (isDefined(basicFundingEligibility[fundingSource].branded)) {
                delete fundingQuery[fundingSource].branded;
            }

            if (!Object.keys(fundingQuery[fundingSource]).length) {
                delete fundingQuery[fundingSource];
            }
        }
    }

    return query('GetFundingEligibility', params(InputTypes, {
        fundingEligibility: params(Inputs, fundingQuery)
    }));
}

export type FundingEligibilityOptions = {|
    logger : LoggerType,
    clientID : string,
    buyerCountry : ?$Values<typeof COUNTRY>,
    currency : $Values<typeof CURRENCY>,
    intent : $Values<typeof INTENT>,
    commit : $Values<typeof COMMIT>,
    vault : $Values<typeof VAULT>,
    disableFunding : $ReadOnlyArray<?$Values<typeof FUNDING>>,
    disableCard : $ReadOnlyArray<?$Values<typeof CARD>>,
    merchantID : ?$ReadOnlyArray<string>,
    buttonSessionID : string,
    clientAccessToken : ?string,
    basicFundingEligibility : FundingEligibility
|};

export async function resolveFundingEligibility(req : ExpressRequest, gqlBatch : GraphQLBatch, { logger, clientID, merchantID, buttonSessionID,
    currency, intent, commit, vault, disableFunding, disableCard, clientAccessToken, buyerCountry, basicFundingEligibility } : FundingEligibilityOptions) : Promise<FundingEligibility> {

    try {
        const ip = req.ip;
        const cookies = req.get('cookie') || '';
        const userAgent = req.get('user-agent') || '';

        intent = intent ? intent.toUpperCase() : intent;
        // $FlowFixMe
        disableFunding = disableFunding ? disableFunding.map(source => source.toUpperCase()) : disableFunding;
        // $FlowFixMe
        disableCard = disableCard ? disableCard.map(source => source.toUpperCase()) : disableCard;

        const result = await gqlBatch({
            query:     buildFundingEligibilityQuery(basicFundingEligibility),
            variables: {
                clientID, merchantID, buyerCountry, cookies, ip, currency, intent, commit,
                vault, disableFunding, disableCard, userAgent, buttonSessionID
            },
            accessToken: clientAccessToken
        });

        return strictMerge(basicFundingEligibility, result.fundingEligibility, (first, second) => {
            return second;
        });

    } catch (err) {
        logger.error(req, 'funding_eligibility_error_fallback', { err: err.stack ? err.stack : err.toString() });
        return basicFundingEligibility;
    }
}
