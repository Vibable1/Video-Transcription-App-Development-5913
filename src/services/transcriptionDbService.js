import supabase from '../lib/supabase';

/**
 * Save a new transcription to the database
 * @param {Object} transcriptionData - Transcription metadata
 * @param {Array} segments - Array of transcription segments
 * @returns {Promise} - Promise with the saved transcription ID
 */
export const saveTranscription = async (transcriptionData, segments) => {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Insert transcription metadata
    const { data: transcription, error: transcriptionError } = await supabase
      .from('transcriptions_73fk5a8d9s')
      .insert({
        user_id: user.id,
        title: transcriptionData.title || transcriptionData.file_name,
        file_name: transcriptionData.file_name,
        duration: transcriptionData.duration,
        language: transcriptionData.language || 'en-US',
        status: 'completed',
        file_size: transcriptionData.file_size,
        file_type: transcriptionData.file_type
      })
      .select('id')
      .single();

    if (transcriptionError) throw transcriptionError;

    // Prepare segments with transcription ID
    const segmentsToInsert = segments.map(segment => ({
      transcription_id: transcription.id,
      start_time: segment.startTime,
      end_time: segment.endTime,
      text: segment.text,
      speaker: segment.speaker || null,
      confidence: segment.confidence || null
    }));

    // Insert segments
    const { error: segmentsError } = await supabase
      .from('transcription_segments_73fk5a8d9s')
      .insert(segmentsToInsert);

    if (segmentsError) throw segmentsError;

    return transcription.id;
  } catch (error) {
    console.error('Error saving transcription:', error);
    throw error;
  }
};

/**
 * Get all transcriptions for the current user
 * @returns {Promise} - Promise with array of transcriptions
 */
export const getUserTranscriptions = async () => {
  try {
    const { data, error } = await supabase
      .from('transcriptions_73fk5a8d9s')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching transcriptions:', error);
    throw error;
  }
};

/**
 * Get a specific transcription with its segments
 * @param {string} transcriptionId - ID of the transcription to retrieve
 * @returns {Promise} - Promise with transcription and segments
 */
export const getTranscriptionWithSegments = async (transcriptionId) => {
  try {
    // Get transcription metadata
    const { data: transcription, error: transcriptionError } = await supabase
      .from('transcriptions_73fk5a8d9s')
      .select('*')
      .eq('id', transcriptionId)
      .single();

    if (transcriptionError) throw transcriptionError;

    // Get transcription segments
    const { data: segments, error: segmentsError } = await supabase
      .from('transcription_segments_73fk5a8d9s')
      .select('*')
      .eq('transcription_id', transcriptionId)
      .order('start_time', { ascending: true });

    if (segmentsError) throw segmentsError;

    // Format segments to match the application's expected structure
    const formattedSegments = segments.map(segment => ({
      id: segment.id,
      startTime: segment.start_time,
      endTime: segment.end_time,
      text: segment.text,
      speaker: segment.speaker || null
    }));

    return {
      ...transcription,
      segments: formattedSegments
    };
  } catch (error) {
    console.error('Error fetching transcription with segments:', error);
    throw error;
  }
};

/**
 * Update a transcription segment
 * @param {string} segmentId - ID of the segment to update
 * @param {Object} updateData - Data to update (text, etc)
 * @returns {Promise} - Promise with updated segment data
 */
export const updateTranscriptionSegment = async (segmentId, updateData) => {
  try {
    const { data, error } = await supabase
      .from('transcription_segments_73fk5a8d9s')
      .update(updateData)
      .eq('id', segmentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating transcription segment:', error);
    throw error;
  }
};

/**
 * Delete a transcription and its segments
 * @param {string} transcriptionId - ID of the transcription to delete
 * @returns {Promise} - Promise with success or error
 */
export const deleteTranscription = async (transcriptionId) => {
  try {
    // Segments will be deleted automatically via ON DELETE CASCADE
    const { error } = await supabase
      .from('transcriptions_73fk5a8d9s')
      .delete()
      .eq('id', transcriptionId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error deleting transcription:', error);
    throw error;
  }
};

/**
 * Update transcription metadata
 * @param {string} transcriptionId - ID of the transcription to update
 * @param {Object} updateData - Data to update
 * @returns {Promise} - Promise with updated transcription data
 */
export const updateTranscription = async (transcriptionId, updateData) => {
  try {
    const { data, error } = await supabase
      .from('transcriptions_73fk5a8d9s')
      .update({
        ...updateData,
        updated_at: new Date()
      })
      .eq('id', transcriptionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating transcription:', error);
    throw error;
  }
};