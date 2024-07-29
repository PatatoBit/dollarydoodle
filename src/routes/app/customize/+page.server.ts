import Stripe from 'stripe';
import { error, redirect } from '@sveltejs/kit';

import type { Actions } from './$types';
import { STRIPE_SECRET_KEY } from '$env/static/private';
import { v4 as uuidv4 } from 'uuid';
import type { RequestData } from '$lib';

const stripe = new Stripe(STRIPE_SECRET_KEY);

enum ProductId {
	small = 'price_1PedNuJIiOwtKCnppUppAMtk',
	medium = 'price_1Pg6PxJIiOwtKCnp27VyMcy1',
	large = 'price_1Pg6QSJIiOwtKCnpaF0G7Sh5'
}

export const actions: Actions = {
	checkout: async ({ request }) => {
		let sessionUrl: string | null;

		const formData = await request.formData();

		const payloadData: RequestData = {
			prompt: formData.get('prompt') as string,
			resolution: formData.get('resolution') as RequestData['resolution'],
			isPrivate: formData.get('private') == 'on',
			isExpress: formData.get('express') == 'on',
			ownerName: formData.get('ownerName') as string,
			ownerId: formData.get('ownerId') as string,
			ownerEmail: formData.get('ownerEmail') as string
		};

		try {
			const uniqueId = uuidv4();

			const session = await stripe.checkout.sessions.create({
				line_items: [
					{
						price: ProductId[payloadData.resolution],
						quantity: 1
					},
					// Express
					{
						price: 'price_1PhqgyJIiOwtKCnphBC1MM7E',
						quantity: payloadData.isExpress ? 1 : 0
					}
				],
				mode: 'payment',
				payment_method_types: ['card'],
				success_url: `${request.headers.get('origin')}/app/request/?id=${uniqueId}&success=true`,
				cancel_url: `${request.headers.get('origin')}/app/?cancelled`,
				metadata: {
					payloadData: JSON.stringify({
						id: uniqueId,
						...payloadData
					})
				}
			});

			sessionUrl = session.url;

			// Saving document
		} catch (err) {
			console.error(err);
			throw error(500, 'Stripe error');
		}

		if (sessionUrl) {
			throw redirect(303, sessionUrl);
		}
	}
};
