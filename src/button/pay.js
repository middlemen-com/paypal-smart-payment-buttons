/* @flow */

import { noop, identity, stringifyError } from 'belter/src';
import { ZalgoPromise } from 'zalgo-promise/src';
import { FPTI_KEY } from '@paypal/sdk-constants/src';

import { checkout, cardFields, native, vaultCapture, popupBridge, type Payment, type PaymentFlow } from '../payment-flows';
import { sendBeacon, getLogger, promiseNoop } from '../lib';
import { FPTI_STATE, FPTI_TRANSITION } from '../constants';

import { type Props, type Config, type ServiceData, type Components } from './props';
import { enableLoadingSpinner, disableLoadingSpinner } from './dom';
import { updateButtonClientConfig, validateOrder } from './orders';

const PAYMENT_FLOWS : $ReadOnlyArray<PaymentFlow> = [
    vaultCapture,
    cardFields,
    popupBridge,
    native,
    checkout
];

export function setupPaymentFlows({ props, config, serviceData, components } : { props : Props, config : Config, serviceData : ServiceData, components : Components }) : ZalgoPromise<void> {
    return ZalgoPromise.all(PAYMENT_FLOWS.map(flow => {
        return flow.isEligible({ props, config, serviceData, components })
            ? flow.setup({ props, config, serviceData, components })
            : null;
    })).then(noop);
}

export function getPaymentFlow({ props, payment, config, components, serviceData } : { props : Props, payment : Payment, config : Config, components : Components, serviceData : ServiceData }) : PaymentFlow {
    for (const flow of PAYMENT_FLOWS) {
        if (flow.isEligible({ props, config, components, serviceData }) && flow.isPaymentEligible({ props, payment, config, components, serviceData })) {
            return flow;
        }
    }

    throw new Error(`Could not find eligible payment flow`);
}

const sendPersonalizationBeacons = (personalization) => {
    if (personalization && personalization.tagline && personalization.tagline.tracking) {
        sendBeacon(personalization.tagline.tracking.click);
    }
    if (personalization && personalization.buttonText && personalization.buttonText.tracking) {
        sendBeacon(personalization.buttonText.tracking.click);
    }
};

type InitiatePaymentType = {|
    payment : Payment,
    props : Props,
    serviceData : ServiceData,
    config : Config,
    components : Components
|};

export function initiatePaymentFlow({ payment, serviceData, config, components, props } : InitiatePaymentType) : ZalgoPromise<void> {
    const { button, fundingSource, decorateCreateOrder = identity } = payment;

    return ZalgoPromise.try(() => {
        const { personalization, merchantID } = serviceData;
        let { clientID, onClick, createOrder, buttonSessionID } = props;

        createOrder = decorateCreateOrder(createOrder);

        sendPersonalizationBeacons(personalization);

        const { name, init, inline, spinner } = getPaymentFlow({ props, payment, config, components, serviceData });
        const { click = promiseNoop, start, close } = init({ props, config, serviceData, components, payment });

        const clickPromise = click();

        getLogger().info(`button_click`).info(`pay_flow_${ name }`).track({
            [FPTI_KEY.STATE]:              FPTI_STATE.BUTTON,
            [FPTI_KEY.TRANSITION]:         FPTI_TRANSITION.BUTTON_CLICK,
            [FPTI_KEY.BUTTON_SESSION_UID]: buttonSessionID,
            [FPTI_KEY.CHOSEN_FUNDING]:     fundingSource
        }).flush();

        return ZalgoPromise.hash({
            valid: onClick ? onClick({ fundingSource }) : true
        }).then(({ valid }) => {
            if (!valid) {
                return;
            }

            if (spinner) {
                enableLoadingSpinner(button);
            }

            createOrder()
                .then(orderID => updateButtonClientConfig({ orderID, fundingSource, inline }))
                .catch(err => getLogger().error('update_client_config_error', { err: stringifyError(err) }));

            return start()
                .then(() => createOrder())
                .then(orderID => validateOrder(orderID, { clientID, merchantID }))
                .then(() => clickPromise)
                .catch(err => {
                    return ZalgoPromise.all([
                        close(),
                        ZalgoPromise.reject(err)
                    ]);
                }).then(noop);
        });

    }).finally(() => {
        disableLoadingSpinner(button);
    });
}
