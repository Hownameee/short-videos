"""Native ComfyUI S2V graph, adapted from the official template; no custom nodes."""


def build(job, image, audio, prefix):
    def node(kind, **inputs):
        return {'class_type': kind, 'inputs': inputs}
    g = {
        '1': node('UNETLoader', unet_name='wan2.2_s2v_14B_fp8_scaled.safetensors', weight_dtype='default'),
        '2': node('CLIPLoader', clip_name='umt5_xxl_fp8_e4m3fn_scaled.safetensors', type='wan', device='cpu'),
        '3': node('VAELoader', vae_name='wan_2.1_vae.safetensors'),
        '4': node('AudioEncoderLoader', audio_encoder_name='wav2vec2_large_english_fp16.safetensors'),
        '5': node('LoadImage', image=image),
        '6': node('LoadAudio', audio=audio),
        '7': node('AudioEncoderEncode', audio_encoder=['4', 0], audio=['6', 0]),
        '8': node('CLIPTextEncode', clip=['2', 0], text=job['prompt']),
        '9': node('CLIPTextEncode', clip=['2', 0], text=job['negativePrompt']),
        '10': node('ModelSamplingSD3', model=['1', 0], shift=job['shift']),
        '11': node('WanSoundImageToVideo', positive=['8', 0], negative=['9', 0], vae=['3', 0],
                   audio_encoder_output=['7', 0], ref_image=['5', 0], width=job['width'],
                   height=job['height'], length=81, batch_size=1),
    }
    sample = dict(model=['10', 0], steps=job['steps'], cfg=job['cfg'],
                  sampler_name='uni_pc', scheduler='simple', denoise=1.0)
    g['12'] = node('KSampler', **sample, seed=job['seed'], positive=['11', 0], negative=['11', 1], latent_image=['11', 2])
    # 21 latent steps per chunk: second chunk starts at audio frame 84, with motion context.
    g['13'] = node('WanSoundImageToVideoExtend', positive=['8', 0], negative=['9', 0], vae=['3', 0],
                   video_latent=['12', 0], audio_encoder_output=['7', 0], ref_image=['5', 0], length=81)
    g['14'] = node('KSampler', **sample, seed=job['seed'] + 1, positive=['13', 0], negative=['13', 1], latent_image=['13', 2])
    g['15'] = node('LatentConcat', samples1=['12', 0], samples2=['14', 0], dim='t')
    # Official template repeats the first latent and drops three decoded frames to avoid first-frame artifacts.
    g['16'] = node('LatentCut', samples=['15', 0], dim='t', index=0, amount=1)
    g['17'] = node('LatentConcat', samples1=['16', 0], samples2=['15', 0], dim='t')
    g['18'] = node('VAEDecodeTiled', samples=['17', 0], vae=['3', 0], tile_size=256, overlap=64,
                   temporal_size=32, temporal_overlap=8)
    g['19'] = node('ImageFromBatch', image=['18', 0], batch_index=3, length=160)
    g['20'] = node('CreateVideo', images=['19', 0], audio=['6', 0], fps=16)
    g['21'] = node('SaveVideo', video=['20', 0], filename_prefix=prefix, format='mp4', codec='h264')
    return g
